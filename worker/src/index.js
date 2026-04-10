/**
 * SeaSky Penthouse — Cloudflare Worker entry point.
 * Replaces the Express.js server with a Workers fetch handler + D1.
 */

import * as db from './db.js';
import * as auth from './auth.js';
import { syncAllFeeds, getEvents, getStatus, generateICS, getFeeds, saveFeeds } from './ics.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function forbidden() {
  return json({ error: 'Forbidden' }, 403);
}

async function requireAdmin(request, env) {
  const user = await auth.getSessionUser(request, env);
  if (!user || user.role !== 'admin') return null;
  return user;
}

async function readJSON(request) {
  try { return await request.json(); }
  catch { return {}; }
}

// ─── Route handler ───────────────────────────────────────────────────────────

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── Auth routes ────────────────────────────────────────────────────────────

  if (path === '/auth/google' && method === 'GET') {
    return auth.handleGoogleRedirect(request, env);
  }
  if (path === '/auth/google/callback' && method === 'GET') {
    return auth.handleGoogleCallback(request, env);
  }
  if (path === '/auth/logout' && method === 'GET') {
    return auth.handleLogout();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  if (path === '/api/me' && method === 'GET') {
    const user = await auth.getSessionUser(request, env);
    if (!user) return json(null);
    const { id, name, email, avatar, role, created_at, last_login, phone } = user;
    return json({ id, name, email, avatar, role, created_at, last_login, phone });
  }

  if (path === '/api/me/phone' && method === 'PATCH') {
    const user = await auth.getSessionUser(request, env);
    if (!user) return forbidden();
    const body = await readJSON(request);
    await db.updateUserPhone(env.DB, user.id, body.phone);
    return json({ ok: true });
  }

  if (path === '/api/version' && method === 'GET') {
    const appRes = await env.ASSETS.fetch(new Request(new URL('/app.js', url.origin)));
    const text = await appRes.text();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))))
      .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 8);
    return new Response(JSON.stringify({ version: hash }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    });
  }

  if (path === '/api/events' && method === 'GET') {
    const events = await getEvents(env.DB);
    return json(events);
  }

  if (path === '/api/status' && method === 'GET') {
    const status = await getStatus(env.DB);
    return json(status);
  }

  if (path === '/api/calendar.ics' && method === 'GET') {
    const icsContent = await generateICS(env.DB);
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="seasky-penthouse.ics"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  if (path === '/api/feeds' && method === 'GET') {
    const feeds = await getFeeds(env.DB);
    return json(feeds.map(({ id, name, color }) => ({ id, name, color })));
  }

  if (path === '/api/config' && method === 'GET') {
    const config = await db.getPublicConfig(env.DB);
    return json(config);
  }

  if (path === '/api/timezones' && method === 'GET') {
    const zones = Intl.supportedValuesOf('timeZone');
    const list = zones.map(tz => {
      try {
        const off = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
          .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
        return { tz, label: `${tz.replace(/_/g, ' ')} (${off})`, off };
      } catch {
        return { tz, label: tz.replace(/_/g, ' '), off: '' };
      }
    }).sort((a, b) => a.off.localeCompare(b.off) || a.tz.localeCompare(b.tz));
    return json(list, 200, { 'Cache-Control': 'public, max-age=86400' });
  }

  if (path === '/api/push/vapid-public-key' && method === 'GET') {
    const key = await db.getConfig(env.DB, 'VAPID_PUBLIC_KEY');
    return json({ key });
  }

  // ── Push subscription (public) ─────────────────────────────────────────────

  if (path === '/api/push/subscribe' && method === 'POST') {
    const body = await readJSON(request);
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return json({ error: 'Invalid subscription object' }, 400);
    }
    await db.saveSub(env.DB, body.endpoint, body.keys.p256dh, body.keys.auth);
    return json({ ok: true });
  }

  if (path === '/api/push/subscribe' && method === 'DELETE') {
    const body = await readJSON(request);
    if (!body.endpoint) return json({ error: 'endpoint required' }, 400);
    await db.removeSub(env.DB, body.endpoint);
    return json({ ok: true });
  }

  // ── Client error logging (public) ──────────────────────────────────────────

  if (path === '/api/errors' && method === 'POST') {
    const body = await readJSON(request);
    if (!body.message) return json({ error: 'message required' }, 400);
    let userId = null;
    try {
      const user = await auth.getSessionUser(request, env);
      if (user) userId = user.id;
    } catch(e) { /* not logged in */ }
    await db.addClientError(env.DB, body.message, body.source, body.lineno, body.colno, body.stack, body.url, request.headers.get('User-Agent'), userId);
    return json({ ok: true });
  }

  // ── Admin: exceptions ─────────────────────────────────────────────────────

  if (path === '/api/admin/errors' && method === 'GET') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    return json(await db.getClientErrors(env.DB));
  }

  if (path === '/api/admin/errors' && method === 'DELETE') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    await db.clearClientErrors(env.DB);
    await db.addLog(env.DB, user.id, user.name, 'Cleared client errors', null);
    return json({ ok: true });
  }

  // ── Changelog (public) ────────────────────────────────────────────────────

  if (path === '/api/changelog' && method === 'GET') {
    const res = await env.ASSETS.fetch(new Request(new URL('/CHANGELOG.json', url.origin)));
    if (!res.ok) return json([]);
    const data = await res.json();
    return json(data, 200, { 'Cache-Control': 'public, max-age=300' });
  }

  // ── Admin: event override ──────────────────────────────────────────────────

  const overrideMatch = path.match(/^\/api\/events\/([^/]+)\/override$/);
  if (overrideMatch && method === 'PATCH') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const eventId = decodeURIComponent(overrideMatch[1]);
    const body = await readJSON(request);
    if (!body.start_dt || !body.end_dt) return json({ error: 'start_dt and end_dt required' }, 400);
    await db.upsertOverride(env.DB, eventId, body.start_dt, body.end_dt, user.id);
    await db.addLog(env.DB, user.id, user.name, 'Updated event times',
      `"${body.title || eventId}" → check-in ${body.start_dt}, check-out ${body.end_dt}`);
    return json({ ok: true });
  }

  // ── Admin: manual sync ─────────────────────────────────────────────────────

  if (path === '/api/sync' && method === 'POST') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const result = await syncAllFeeds(env.DB);
    await db.addLog(env.DB, user.id, user.name, 'Manual calendar sync',
      `${result.totalEvents} events loaded`);
    return json({ ok: true, lastSync: result.lastSync, totalEvents: result.totalEvents });
  }

  // ── Admin: cron jobs ───────────────────────────────────────────────────────

  if (path === '/api/admin/cron-jobs' && method === 'GET') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const status = await getStatus(env.DB);
    const jobs = [
      {
        id: 'sync-feeds',
        name: 'Sync iCal Feeds',
        schedule: '0 * * * *',
        description: 'Fetches latest bookings from Airbnb, Booking.com, and official website',
        lastRun: status.lastSync,
        feedStatus: status.feeds,
      },
    ];
    const history = await db.getCronHistory(env.DB);
    return json({ jobs, history });
  }

  if (path.match(/^\/api\/admin\/cron-jobs\/([^/]+)\/run$/) && method === 'POST') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const jobId = path.match(/^\/api\/admin\/cron-jobs\/([^/]+)\/run$/)[1];
    if (jobId !== 'sync-feeds') return json({ error: 'Unknown job' }, 404);
    try {
      const result = await syncAllFeeds(env.DB);
      await db.addCronRun(env.DB, jobId, 'success', `${result.totalEvents} events synced`);
      await db.addLog(env.DB, user.id, user.name, 'Manual cron run: sync-feeds',
        `${result.totalEvents} events synced`);
      return json({ ok: true, totalEvents: result.totalEvents, lastSync: result.lastSync });
    } catch (err) {
      await db.addCronRun(env.DB, jobId, 'error', err.message);
      return json({ ok: false, error: err.message }, 500);
    }
  }

  // ── Admin: user management ─────────────────────────────────────────────────

  if (path === '/api/admin/users' && method === 'GET') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    return json(await db.listUsers(env.DB));
  }

  const userRoleMatch = path.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  if (userRoleMatch && method === 'PATCH') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const id = parseInt(userRoleMatch[1], 10);
    const body = await readJSON(request);
    if (!body.role) return json({ error: 'role required' }, 400);
    try {
      const target = await db.getUserById(env.DB, id);
      await db.setUserRole(env.DB, id, body.role);
      await db.addLog(env.DB, user.id, user.name, 'Changed user role',
        `${target?.name || id} → ${body.role}`);
      return json({ ok: true });
    } catch (err) {
      return json({ error: err.message }, 400);
    }
  }

  const userDeleteMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
  if (userDeleteMatch && method === 'DELETE') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const id = parseInt(userDeleteMatch[1], 10);
    if (id === user.id) return json({ error: 'Cannot delete yourself' }, 400);
    const target = await db.getUserById(env.DB, id);
    await db.deleteUser(env.DB, id);
    await db.addLog(env.DB, user.id, user.name, 'Removed user', target?.name || String(id));
    return json({ ok: true });
  }

  // ── Admin: activity logs ───────────────────────────────────────────────────

  if (path === '/api/admin/logs' && method === 'GET') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    return json(await db.getLogs(env.DB));
  }

  // ── Admin: config management ───────────────────────────────────────────────

  if (path === '/api/admin/config' && method === 'GET') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    return json(await db.getAllConfig(env.DB));
  }

  const configKeyMatch = path.match(/^\/api\/admin\/config\/([^/]+)$/);
  if (configKeyMatch && method === 'PUT') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const key = decodeURIComponent(configKeyMatch[1]);
    const body = await readJSON(request);
    if (body.value === undefined) return json({ error: 'value required' }, 400);
    await db.setConfig(env.DB, key, body.value, !!body.is_public);
    await db.addLog(env.DB, user.id, user.name, 'Updated config',
      `${key} = ${body.is_public ? '(public)' : '(private)'}`);
    return json({ ok: true });
  }

  if (configKeyMatch && method === 'DELETE') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const key = decodeURIComponent(configKeyMatch[1]);
    await db.deleteConfig(env.DB, key);
    await db.addLog(env.DB, user.id, user.name, 'Deleted config', key);
    return json({ ok: true });
  }

  // ── Admin: ICS feeds management ─────────────────────────────────────────────

  if (path === '/api/admin/feeds' && method === 'GET') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const feeds = await getFeeds(env.DB);
    return json(feeds);
  }

  if (path === '/api/admin/feeds' && method === 'PUT') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const body = await readJSON(request);
    if (!Array.isArray(body.feeds)) return json({ error: 'feeds array required' }, 400);
    // Validate each feed
    for (const f of body.feeds) {
      if (!f.id || !f.name || !f.url) return json({ error: 'Each feed needs id, name, url' }, 400);
    }
    await saveFeeds(env.DB, body.feeds);
    await db.addLog(env.DB, user.id, user.name, 'Updated ICS feeds',
      `${body.feeds.length} feed(s) configured`);
    return json({ ok: true });
  }

  // ── Booking inquiries ──────────────────────────────────────────────────────

  if (path === '/api/inquiries' && method === 'POST') {
    const body = await readJSON(request);
    if (!body.check_in || !body.check_out || !body.email) {
      return json({ error: 'check_in, check_out, and email are required' }, 400);
    }
    // Attach user_id if logged in
    let userId = null;
    try {
      const user = await auth.getSessionUser(request, env);
      if (user) userId = user.id;
    } catch(e) { /* not logged in */ }
    const id = await db.addInquiry(env.DB, body.check_in, body.check_out, body.guests, body.name, body.email, body.phone, body.comment, userId);
    return json({ ok: true, id });
  }

  if (path === '/api/admin/inquiries' && method === 'GET') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    return json(await db.getInquiries(env.DB));
  }

  const inquiryStatusMatch = path.match(/^\/api\/admin\/inquiries\/(\d+)\/status$/);
  if (inquiryStatusMatch && method === 'PATCH') {
    const user = await requireAdmin(request, env);
    if (!user) return forbidden();
    const id = parseInt(inquiryStatusMatch[1], 10);
    const body = await readJSON(request);
    if (!body.status) return json({ error: 'status required' }, 400);
    await db.updateInquiryStatus(env.DB, id, body.status);
    await db.addLog(env.DB, user.id, user.name, 'Updated inquiry status', `Inquiry #${id} → ${body.status}`);
    return json({ ok: true });
  }

  // ── WASM MIME type fix ─────────────────────────────────────────────────────

  if (path.endsWith('.wasm')) {
    const assetRes = await env.ASSETS.fetch(request);
    return new Response(assetRes.body, {
      status: assetRes.status,
      headers: { ...Object.fromEntries(assetRes.headers), 'Content-Type': 'application/wasm' },
    });
  }

  // ── SPA fallback for client-side routing (/en/*, /bg/*) ────────────────────

  if (/^\/(en|bg)(\/[a-z-]*)?$/.test(path)) {
    return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin)));
  }

  // ── Fall through to static assets ──────────────────────────────────────────

  return env.ASSETS.fetch(request);
}

// ─── Worker export ───────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    try {
      await db.ensureSchema(env.DB);

      // Auto-sync on first request if cache is empty
      const cached = await db.getCachedEvents(env.DB);
      if (cached.length === 0) {
        ctx.waitUntil(syncAllFeeds(env.DB));
      }

      return await handleRequest(request, env);
    } catch (err) {
      console.error('Worker error:', err.stack || err.message);
      return json({ error: 'Internal server error' }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    try {
      await db.ensureSchema(env.DB);
      const result = await syncAllFeeds(env.DB);
      await db.addCronRun(env.DB, 'sync-feeds', 'success', `${result.totalEvents} events synced`);
    } catch (err) {
      console.error('Scheduled sync error:', err.stack || err.message);
      try { await db.addCronRun(env.DB, 'sync-feeds', 'error', err.message); } catch(e) {}
    }
  },
};
