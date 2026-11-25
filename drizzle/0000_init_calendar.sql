-- Initial D1 migration for NVMSA OS (Better Auth + Content Calendar module)

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'officer',
  entity_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS calendar_slots (
  id TEXT PRIMARY KEY NOT NULL,
  post_date TEXT NOT NULL,
  title TEXT NOT NULL,
  entity_code TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'poster',
  status TEXT NOT NULL DEFAULT 'booked',
  notes TEXT,
  relocation_reason TEXT,
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- DB-level concurrency guarantee: at most 1 active booked post per Cairo calendar date
CREATE UNIQUE INDEX IF NOT EXISTS calendar_slots_booked_date_uidx
  ON calendar_slots (post_date)
  WHERE status = 'booked';

CREATE INDEX IF NOT EXISTS calendar_slots_status_date_idx
  ON calendar_slots (status, post_date);
