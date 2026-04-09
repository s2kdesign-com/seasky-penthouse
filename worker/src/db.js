/**
 * D1 database layer — async version of the original better-sqlite3 module.
 * All functions take `db` (the D1 binding) as the first argument.
 */

// ─── Schema bootstrap ────────────────────────────────────────────────────────

export async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id   TEXT    UNIQUE NOT NULL,
      name        TEXT    NOT NULL,
      email       TEXT,
      avatar      TEXT,
      role        TEXT    NOT NULL DEFAULT 'subscriber',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login  DATETIME
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint   TEXT    UNIQUE NOT NULL,
      p256dh     TEXT    NOT NULL,
      auth       TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS activity_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      user_name   TEXT,
      action      TEXT    NOT NULL,
      details     TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS event_overrides (
      event_id    TEXT     PRIMARY KEY,
      start_dt    TEXT     NOT NULL,
      end_dt      TEXT     NOT NULL,
      updated_by  INTEGER,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS config (
      key         TEXT    PRIMARY KEY,
      value       TEXT    NOT NULL,
      is_public   INTEGER NOT NULL DEFAULT 0,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS events_cache (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      source      TEXT NOT NULL,
      source_name TEXT NOT NULL,
      color       TEXT NOT NULL,
      raw_start   TEXT NOT NULL,
      raw_end     TEXT NOT NULL,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sync_status (
      feed_id     TEXT PRIMARY KEY,
      feed_name   TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      last_checked TEXT,
      error       TEXT,
      event_count INTEGER DEFAULT 0
    )`),
  ]);
}

// ─── Users ───────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 's2kdesign.digital@gmail.com';

export async function upsertUser(db, googleId, name, email, avatar) {
  const existing = await db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first();
  if (existing) {
    await db.prepare('UPDATE users SET name = ?, email = ?, avatar = ?, last_login = CURRENT_TIMESTAMP WHERE google_id = ?')
      .bind(name, email, avatar, googleId).run();
    return db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first();
  }
  const role = email === ADMIN_EMAIL ? 'admin' : 'subscriber';
  await db.prepare('INSERT INTO users (google_id, name, email, avatar, role) VALUES (?, ?, ?, ?, ?)')
    .bind(googleId, name, email, avatar, role).run();
  return db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first();
}

export async function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}

export async function listUsers(db) {
  const { results } = await db.prepare('SELECT id, google_id, name, email, avatar, role, created_at, last_login FROM users ORDER BY created_at').all();
  return results;
}

export async function setUserRole(db, id, role) {
  if (!['admin', 'subscriber'].includes(role)) throw new Error('Invalid role');
  await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
}

export async function deleteUser(db, id) {
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
}

// ─── Push subscriptions ──────────────────────────────────────────────────────

export async function saveSub(db, endpoint, p256dh, auth) {
  await db.prepare(`INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`)
    .bind(endpoint, p256dh, auth).run();
}

export async function removeSub(db, endpoint) {
  await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
}

export async function getAllSubs(db) {
  const { results } = await db.prepare('SELECT * FROM push_subscriptions').all();
  return results;
}

// ─── Activity logs ───────────────────────────────────────────────────────────

export async function addLog(db, userId, userName, action, details) {
  await db.prepare('INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)')
    .bind(userId, userName, action, details || null).run();
}

export async function getLogs(db) {
  const { results } = await db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500').all();
  return results;
}

// ─── Event overrides ─────────────────────────────────────────────────────────

export async function getOverride(db, eventId) {
  return db.prepare('SELECT * FROM event_overrides WHERE event_id = ?').bind(eventId).first();
}

export async function getAllOverrides(db) {
  const { results } = await db.prepare('SELECT * FROM event_overrides').all();
  return results;
}

export async function upsertOverride(db, eventId, startDt, endDt, userId) {
  await db.prepare(`INSERT INTO event_overrides (event_id, start_dt, end_dt, updated_by) VALUES (?, ?, ?, ?)
    ON CONFLICT(event_id) DO UPDATE SET start_dt = excluded.start_dt, end_dt = excluded.end_dt,
    updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`)
    .bind(eventId, startDt, endDt, userId).run();
}

// ─── Config ──────────────────────────────────────────────────────────────────

export async function getConfig(db, key) {
  const row = await db.prepare('SELECT value FROM config WHERE key = ?').bind(key).first();
  return row ? row.value : null;
}

export async function getAllConfig(db) {
  const { results } = await db.prepare('SELECT key, value, is_public FROM config ORDER BY key').all();
  return results;
}

export async function getPublicConfig(db) {
  const { results } = await db.prepare('SELECT key, value FROM config WHERE is_public = 1 ORDER BY key').all();
  return Object.fromEntries(results.map(r => [r.key, r.value]));
}

export async function setConfig(db, key, value, isPublic) {
  await db.prepare(`INSERT INTO config (key, value, is_public) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, is_public = excluded.is_public, updated_at = CURRENT_TIMESTAMP`)
    .bind(key, String(value), isPublic ? 1 : 0).run();
}

export async function deleteConfig(db, key) {
  await db.prepare('DELETE FROM config WHERE key = ?').bind(key).run();
}

// ─── Events cache (Workers-specific — replaces in-memory cache) ──────────────

export async function cacheEvents(db, events) {
  // Clear and re-insert all events
  await db.prepare('DELETE FROM events_cache').run();
  // Batch insert in groups of 50 (D1 batch limit)
  for (let i = 0; i < events.length; i += 50) {
    const batch = events.slice(i, i + 50).map(ev =>
      db.prepare('INSERT INTO events_cache (id, title, description, source, source_name, color, raw_start, raw_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(ev.id, ev.title, ev.description || '', ev.source, ev.sourceName, ev.color, ev.rawStart, ev.rawEnd)
    );
    await db.batch(batch);
  }
}

export async function getCachedEvents(db) {
  const { results } = await db.prepare('SELECT * FROM events_cache').all();
  return results;
}

export async function updateSyncStatus(db, feedId, feedName, status, error, eventCount) {
  await db.prepare(`INSERT INTO sync_status (feed_id, feed_name, status, last_checked, error, event_count)
    VALUES (?, ?, ?, datetime('now'), ?, ?)
    ON CONFLICT(feed_id) DO UPDATE SET feed_name = excluded.feed_name, status = excluded.status,
    last_checked = excluded.last_checked, error = excluded.error, event_count = excluded.event_count`)
    .bind(feedId, feedName, status, error || null, eventCount).run();
}

export async function getSyncStatus(db) {
  const { results } = await db.prepare('SELECT * FROM sync_status').all();
  return results;
}

export async function getLastSync(db) {
  return getConfig(db, '_LAST_SYNC');
}

export async function setLastSync(db, timestamp) {
  await setConfig(db, '_LAST_SYNC', timestamp, false);
}
