'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const cron = require('node-cron');
const { syncAllFeeds, getEvents, getStatus, getFeeds, setFeeds } = require('./calendarService');
const db = require('./db');

const app = express();
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HTTP_PORT  = process.env.PORT || 3000;

// ─── TLS certificate ──────────────────────────────────────────────────────────
const CERT_DIR = path.join(__dirname, '..', 'certs');
const tlsOptions = {
  key:  fs.readFileSync(path.join(CERT_DIR, 'localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(CERT_DIR, 'localhost+2.pem')),
};

app.use(express.json());

// ─── Session ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'seasky-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, secure: true, sameSite: 'lax' },
}));

// ─── Passport ─────────────────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:' + HTTP_PORT}/auth/google/callback`,
  },
  (_accessToken, _refreshToken, profile, done) => {
    try {
      const user = db.upsertUser(profile);
      done(null, user);
    } catch (err) {
      done(err);
    }
  },
));

// Store DB user id in session
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.getUserById(id);
  done(null, user || false);
});

app.use(passport.initialize());
app.use(passport.session());

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user?.role === 'admin') return next();
  res.status(403).json({ error: 'Forbidden' });
}

// ─── Auth routes ──────────────────────────────────────────────────────────────
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?login_error=1' }),
  (_req, res) => res.redirect('/')
);

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// ─── Public API ───────────────────────────────────────────────────────────────

// Current logged-in user (null if not signed in)
app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) return res.json(null);
  const { id, name, email, avatar, role } = req.user;
  res.json({ id, name, email, avatar, role });
});

// Calendar data — always public
app.get('/api/events', (_req, res) => res.json(getEvents()));
app.get('/api/status', (_req, res) => res.json(getStatus()));
app.get('/api/feeds',  (_req, res) => res.json(getFeeds().map(({ id, name, color }) => ({ id, name, color }))));

// ICS calendar feed export
app.get('/api/calendar.ics', (_req, res) => {
  const events = getEvents();
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//SeaSky Apartments//Booking Dashboard//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:SeaSky Penthouse Bookings',
    'X-WR-TIMEZONE:Europe/Sofia',
  ];
  for (const ev of events) {
    const uid = (ev.id || '').replace(/[^a-zA-Z0-9_-]/g, '_') + '@seasky-penthouse';
    const toICS = (s) => { const d = new Date(s); return isNaN(d) ? '' : d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    const dtstart = toICS(ev.start || ev.rawStart);
    const dtend = toICS(ev.end || ev.rawEnd);
    if (!dtstart || !dtend) continue;
    const summary = (ev.title || 'Booked').replace(/[,;\\]/g, '\\$&');
    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${now}`,
      `DTSTART:${dtstart}`, `DTEND:${dtend}`, `SUMMARY:${summary}`,
      `CATEGORIES:${ev.sourceName || ev.source || ''}`, 'STATUS:CONFIRMED', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  res.set({
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'attachment; filename="seasky-penthouse.ics"',
    'Cache-Control': 'public, max-age=3600',
  });
  res.send(lines.join('\r\n'));
});

// Public config (GOOGLE_CLIENT_ID, VAPID_PUBLIC_KEY, etc.)
app.get('/api/config', (_req, res) => res.json(db.getPublicConfig()));

// Pre-computed timezone list (avoids slow client-side Intl computation)
let _tzCache = null;
app.get('/api/timezones', (_req, res) => {
  if (!_tzCache) {
    const zones = Intl.supportedValuesOf('timeZone');
    _tzCache = zones.map(tz => {
      try {
        const off = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
          .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
        return { tz, label: `${tz.replace(/_/g, ' ')} (${off})`, off };
      } catch {
        return { tz, label: tz.replace(/_/g, ' '), off: '' };
      }
    }).sort((a, b) => a.off.localeCompare(b.off) || a.tz.localeCompare(b.tz));
  }
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(_tzCache);
});

// Save date/time override for a single event — admin only
app.patch('/api/events/:id/override', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { start_dt, end_dt, title } = req.body;
  if (!start_dt || !end_dt) return res.status(400).json({ error: 'start_dt and end_dt required' });
  try {
    db.upsertOverride(id, start_dt, end_dt, req.user.id);
    db.addLog(req.user.id, req.user.name, 'Updated event times',
      `"${title || id}" → check-in ${start_dt}, check-out ${end_dt}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual sync — admin only
app.post('/api/sync', requireAdmin, async (req, res) => {
  try {
    const result = await syncAllFeeds();
    db.addLog(req.user.id, req.user.name, 'Manual calendar sync',
      `${result.events.length} events loaded`);
    res.json({ ok: true, lastSync: result.lastSync, totalEvents: result.events.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Admin: user management ───────────────────────────────────────────────────
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  res.json(db.listUsers());
});

app.patch('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'role required' });
  try {
    const target = db.getUserById(id);
    db.setUserRole(id, role);
    db.addLog(req.user.id, req.user.name, 'Changed user role',
      `${target?.name || id} → ${role}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const target = db.getUserById(id);
  db.deleteUser(id);
  db.addLog(req.user.id, req.user.name, 'Removed user', target?.name || String(id));
  res.json({ ok: true });
});

// Activity logs — admin only
app.get('/api/admin/logs', requireAdmin, (_req, res) => {
  res.json(db.getLogs());
});

// Config management — admin only
app.get('/api/admin/config', requireAdmin, (_req, res) => {
  res.json(db.getAllConfig());
});

app.put('/api/admin/config/:key', requireAdmin, (req, res) => {
  const { key } = req.params;
  const { value, is_public } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });
  db.setConfig(key, value, !!is_public);
  db.addLog(req.user.id, req.user.name, 'Updated config', `${key} = ${is_public ? '(public)' : '(private)'}`);
  res.json({ ok: true });
});

app.delete('/api/admin/config/:key', requireAdmin, (req, res) => {
  db.deleteConfig(req.params.key);
  db.addLog(req.user.id, req.user.name, 'Deleted config', req.params.key);
  res.json({ ok: true });
});

// ─── Admin: ICS feeds management ─────────────────────────────────────────────
app.get('/api/admin/feeds', requireAdmin, (_req, res) => {
  res.json(getFeeds());
});

app.put('/api/admin/feeds', requireAdmin, (req, res) => {
  const { feeds } = req.body;
  if (!Array.isArray(feeds)) return res.status(400).json({ error: 'feeds array required' });
  for (const f of feeds) {
    if (!f.id || !f.name || !f.url) return res.status(400).json({ error: 'Each feed needs id, name, url' });
  }
  setFeeds(feeds);
  db.addLog(req.user.id, req.user.name, 'Updated ICS feeds', `${feeds.length} feed(s) configured`);
  res.json({ ok: true });
});

// ─── Push notifications ───────────────────────────────────────────────────────
app.get('/api/push/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return res.status(400).json({ error: 'Invalid subscription object' });
  db.saveSub(endpoint, keys.p256dh, keys.auth);
  res.json({ ok: true });
});

app.delete('/api/push/subscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
  db.removeSub(endpoint);
  res.json({ ok: true });
});

// ─── Static files (always public) ────────────────────────────────────────────
// Ensure .wasm files are served with the correct MIME type
app.use((req, res, next) => {
  if (req.path.endsWith('.wasm')) res.type('application/wasm');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ─── Cron Job ─────────────────────────────────────────────────────────────────
cron.schedule('0 * * * *', async () => {
  await syncAllFeeds();
});

// ─── Start ────────────────────────────────────────────────────────────────────
(async () => {
  // Seed config table from .env (only inserts missing keys)
  db.seedConfigFromEnv(process.env);
  console.log('Config seeded from .env');

  await syncAllFeeds();

  // HTTPS server
  https.createServer(tlsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`SeaSky Penthouse dashboard running at https://localhost:${HTTPS_PORT}`);
  });

  // HTTP → HTTPS redirect
  http.createServer((req, res) => {
    const host = (req.headers.host || 'localhost').split(':')[0];
    res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
    res.end();
  }).listen(HTTP_PORT, () => {
    console.log(`HTTP redirect listening on http://localhost:${HTTP_PORT} → https`);
  });
})();
