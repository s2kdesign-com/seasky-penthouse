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
`);

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

function getOverride(eventId)  { return stmts.getOverride.get(eventId); }
function getAllOverrides()      { return stmts.getAllOverrides.all(); }
function upsertOverride(eventId, startDt, endDt, userId) {
  stmts.upsertOverride.run({ event_id: eventId, start_dt: startDt, end_dt: endDt, updated_by: userId });
}

module.exports = {
  upsertUser, getUserByGoogleId, getUserById, listUsers, setUserRole, deleteUser,
  saveSub, removeSub, getAllSubs,
  addLog, getLogs,
  getOverride, getAllOverrides, upsertOverride,
};
