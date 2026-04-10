'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'seasky.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint   TEXT    UNIQUE NOT NULL,
    p256dh     TEXT    NOT NULL,
    auth       TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    user_name   TEXT,
    action      TEXT    NOT NULL,
    details     TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_overrides (
    event_id    TEXT     PRIMARY KEY,
    start_dt    TEXT     NOT NULL,  -- local ISO datetime e.g. "2026-04-07T15:00"
    end_dt      TEXT     NOT NULL,  -- local ISO datetime e.g. "2026-04-10T11:00"
    updated_by  INTEGER,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id   TEXT    UNIQUE NOT NULL,
    name        TEXT    NOT NULL,
    email       TEXT,
    avatar      TEXT,
    role        TEXT    NOT NULL DEFAULT 'subscriber',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login  DATETIME
  );

  CREATE TABLE IF NOT EXISTS config (
    key         TEXT    PRIMARY KEY,
    value       TEXT    NOT NULL,
    is_public   INTEGER NOT NULL DEFAULT 0,  -- 1 = safe to expose on GitHub Pages
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS booking_inquiries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    check_in    TEXT    NOT NULL,
    check_out   TEXT    NOT NULL,
    guests      INTEGER NOT NULL DEFAULT 1,
    name        TEXT,
    email       TEXT    NOT NULL,
    phone       TEXT,
    comment     TEXT,
    user_id     INTEGER,
    status      TEXT    NOT NULL DEFAULT 'pending',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS cron_runs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id      TEXT    NOT NULL,
    status      TEXT    NOT NULL,
    details     TEXT,
    run_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add phone column to users table (ignore if already exists)
try { db.prepare('ALTER TABLE users ADD COLUMN phone TEXT').run(); } catch(e) { /* column may already exist */ }

// ─── Queries ──────────────────────────────────────────────────────────────────
const stmts = {
  findByGoogleId: db.prepare('SELECT * FROM users WHERE google_id = ?'),
  insert: db.prepare(`
    INSERT INTO users (google_id, name, email, avatar, role)
    VALUES (@google_id, @name, @email, @avatar, @role)
  `),
  updateLogin: db.prepare(`
    UPDATE users SET name = @name, email = @email, avatar = @avatar, last_login = CURRENT_TIMESTAMP
    WHERE google_id = @google_id
  `),
  listAll: db.prepare('SELECT id, google_id, name, email, avatar, role, created_at, last_login FROM users ORDER BY created_at'),
  setRole: db.prepare('UPDATE users SET role = ? WHERE id = ?'),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),

  // push subscriptions
  upsertSub: db.prepare(`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth)
    VALUES (@endpoint, @p256dh, @auth)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth
  `),
  deleteSub:  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?'),
  getAllSubs:  db.prepare('SELECT * FROM push_subscriptions'),

  // activity logs
  insertLog: db.prepare(`
    INSERT INTO activity_logs (user_id, user_name, action, details)
    VALUES (@user_id, @user_name, @action, @details)
  `),
  getLogs: db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500'),

  // cron runs
  insertCronRun: db.prepare('INSERT INTO cron_runs (job_id, status, details) VALUES (?, ?, ?)'),
  getCronHistory: db.prepare('SELECT * FROM cron_runs ORDER BY run_at DESC LIMIT 50'),

  // event overrides
  getOverride:    db.prepare('SELECT * FROM event_overrides WHERE event_id = ?'),
  getAllOverrides: db.prepare('SELECT * FROM event_overrides'),
  upsertOverride: db.prepare(`
    INSERT INTO event_overrides (event_id, start_dt, end_dt, updated_by)
    VALUES (@event_id, @start_dt, @end_dt, @updated_by)
    ON CONFLICT(event_id) DO UPDATE SET
      start_dt   = excluded.start_dt,
      end_dt     = excluded.end_dt,
      updated_by = excluded.updated_by,
      updated_at = CURRENT_TIMESTAMP
  `),

  // config
  getConfig:       db.prepare('SELECT value FROM config WHERE key = ?'),
  getAllConfig:     db.prepare('SELECT key, value, is_public FROM config ORDER BY key'),
  getPublicConfig: db.prepare('SELECT key, value FROM config WHERE is_public = 1 ORDER BY key'),
  upsertConfig:    db.prepare(`
    INSERT INTO config (key, value, is_public)
    VALUES (@key, @value, @is_public)
    ON CONFLICT(key) DO UPDATE SET
      value      = excluded.value,
      is_public  = excluded.is_public,
      updated_at = CURRENT_TIMESTAMP
  `),
  deleteConfig:    db.prepare('DELETE FROM config WHERE key = ?'),

  // booking inquiries
  insertInquiry: db.prepare(`
    INSERT INTO booking_inquiries (check_in, check_out, guests, name, email, phone, comment, user_id)
    VALUES (@check_in, @check_out, @guests, @name, @email, @phone, @comment, @user_id)
  `),
  getInquiries: db.prepare('SELECT * FROM booking_inquiries ORDER BY created_at DESC LIMIT 500'),
  updateInquiryStatus: db.prepare('UPDATE booking_inquiries SET status = ? WHERE id = ?'),

  // user phone
  updateUserPhone: db.prepare('UPDATE users SET phone = ? WHERE id = ?'),
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upsert a user from a Google OAuth profile.
 * The very first user to sign in becomes an admin automatically.
 */
function upsertUser(profile) {
  const googleId = profile.id;
  const name = profile.displayName || 'Unknown';
  const email = profile.emails?.[0]?.value ?? null;
  const avatar = profile.photos?.[0]?.value ?? null;

  const existing = stmts.findByGoogleId.get(googleId);

  if (existing) {
    stmts.updateLogin.run({ google_id: googleId, name, email, avatar });
    return stmts.findByGoogleId.get(googleId);
  }

  const ADMIN_EMAIL = 's2kdesign.digital@gmail.com';
  const role = email === ADMIN_EMAIL ? 'admin' : 'subscriber';

  stmts.insert.run({ google_id: googleId, name, email, avatar, role });
  return stmts.findByGoogleId.get(googleId);
}

function getUserByGoogleId(googleId) {
  return stmts.findByGoogleId.get(googleId);
}

function getUserById(id) {
  return stmts.findById.get(id);
}

function listUsers() {
  return stmts.listAll.all();
}

function setUserRole(id, role) {
  if (!['admin', 'subscriber'].includes(role)) throw new Error('Invalid role');
  stmts.setRole.run(role, id);
}

function deleteUser(id) {
  stmts.deleteUser.run(id);
}

function saveSub(endpoint, p256dh, auth) { stmts.upsertSub.run({ endpoint, p256dh, auth }); }
function removeSub(endpoint)             { stmts.deleteSub.run(endpoint); }
function getAllSubs()                     { return stmts.getAllSubs.all(); }

function addLog(userId, userName, action, details) {
  stmts.insertLog.run({ user_id: userId, user_name: userName, action, details: details || null });
}
function getLogs() { return stmts.getLogs.all(); }

function addCronRun(jobId, status, details) {
  stmts.insertCronRun.run(jobId, status, details || null);
}
function getCronHistory() { return stmts.getCronHistory.all(); }

function getOverride(eventId)  { return stmts.getOverride.get(eventId); }
function getAllOverrides()      { return stmts.getAllOverrides.all(); }
function upsertOverride(eventId, startDt, endDt, userId) {
  stmts.upsertOverride.run({ event_id: eventId, start_dt: startDt, end_dt: endDt, updated_by: userId });
}

// Config
function getConfig(key)     { const r = stmts.getConfig.get(key); return r ? r.value : null; }
function getAllConfig()      { return stmts.getAllConfig.all(); }
function getPublicConfig()  {
  const rows = stmts.getPublicConfig.all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}
function setConfig(key, value, isPublic) {
  stmts.upsertConfig.run({ key, value: String(value), is_public: isPublic ? 1 : 0 });
}
function deleteConfig(key)  { stmts.deleteConfig.run(key); }

// Booking inquiries
function addInquiry(checkIn, checkOut, guests, name, email, phone, comment, userId) {
  const info = stmts.insertInquiry.run({
    check_in: checkIn, check_out: checkOut, guests: guests || 1,
    name: name || null, email, phone: phone || null,
    comment: comment || null, user_id: userId || null
  });
  return info.lastInsertRowid;
}
function getInquiries()  { return stmts.getInquiries.all(); }
function updateInquiryStatus(id, status) { stmts.updateInquiryStatus.run(status, id); }

// User phone
function updateUserPhone(id, phone) { stmts.updateUserPhone.run(phone || null, id); }

/**
 * Seed config table from environment variables (only inserts missing keys).
 */
function seedConfigFromEnv(env) {
  const seeds = [
    // Public — safe to expose on GitHub Pages
    { key: 'GOOGLE_CLIENT_ID',  value: env.GOOGLE_CLIENT_ID,  isPublic: true },
    { key: 'VAPID_PUBLIC_KEY',  value: env.VAPID_PUBLIC_KEY,  isPublic: true },
    { key: 'BASE_URL',          value: env.BASE_URL,          isPublic: true },
    // Private — server-only secrets
    { key: 'GOOGLE_CLIENT_SECRET', value: env.GOOGLE_CLIENT_SECRET, isPublic: false },
    { key: 'GOOGLE_API_KEY',      value: env.GOOGLE_API_KEY,       isPublic: false },
    { key: 'VAPID_PRIVATE_KEY',   value: env.VAPID_PRIVATE_KEY,    isPublic: false },
    { key: 'VAPID_EMAIL',         value: env.VAPID_EMAIL,          isPublic: false },
    { key: 'SESSION_SECRET',      value: env.SESSION_SECRET,       isPublic: false },
  ];
  for (const s of seeds) {
    if (!s.value) continue;
    // Only seed if key doesn't already exist
    const existing = stmts.getConfig.get(s.key);
    if (!existing) {
      stmts.upsertConfig.run({ key: s.key, value: s.value, is_public: s.isPublic ? 1 : 0 });
    }
  }
}

module.exports = {
  upsertUser, getUserByGoogleId, getUserById, listUsers, setUserRole, deleteUser,
  saveSub, removeSub, getAllSubs,
  addLog, getLogs, addCronRun, getCronHistory,
  getOverride, getAllOverrides, upsertOverride,
  getConfig, getAllConfig, getPublicConfig, setConfig, deleteConfig, seedConfigFromEnv,
  addInquiry, getInquiries, updateInquiryStatus, updateUserPhone,
};
