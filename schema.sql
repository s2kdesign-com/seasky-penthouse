-- SeaSky Penthouse — D1 database schema

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
  start_dt    TEXT     NOT NULL,
  end_dt      TEXT     NOT NULL,
  updated_by  INTEGER,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS config (
  key         TEXT    PRIMARY KEY,
  value       TEXT    NOT NULL,
  is_public   INTEGER NOT NULL DEFAULT 0,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events_cache (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  source      TEXT NOT NULL,
  source_name TEXT NOT NULL,
  color       TEXT NOT NULL,
  raw_start   TEXT NOT NULL,
  raw_end     TEXT NOT NULL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_status (
  feed_id     TEXT PRIMARY KEY,
  feed_name   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  last_checked TEXT,
  error       TEXT,
  event_count INTEGER DEFAULT 0
);
