-- NVMSA OS v1.0 Clean D1 Baseline Schema
-- Generated for clean pre-launch deployment of Platform Core + Module 1 (Content Calendar)

-- Better Auth identity & session tables (emailAndPassword disabled; Google OAuth only)
CREATE TABLE user (
  id             TEXT PRIMARY KEY NOT NULL,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image          TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE TABLE session (
  id         TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_user_id ON session(user_id);

CREATE TABLE account (
  id                       TEXT PRIMARY KEY NOT NULL,
  account_id               TEXT NOT NULL,
  provider_id              TEXT NOT NULL,
  user_id                  TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token             TEXT,
  refresh_token            TEXT,
  id_token                 TEXT,
  access_token_expires_at  INTEGER,
  refresh_token_expires_at INTEGER,
  scope                    TEXT,
  password                 TEXT,
  created_at               INTEGER NOT NULL,
  updated_at               INTEGER NOT NULL
);

CREATE INDEX idx_account_user_id ON account(user_id);

CREATE TABLE verification (
  id         TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value      TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

-- Canonical Organizational Units (seeded in 0001_seed_nvmsa.sql)
CREATE TABLE org_units (
  id           TEXT PRIMARY KEY NOT NULL,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('COMMITTEE', 'DIVISION', 'BOARD')),
  accent_token TEXT NOT NULL CHECK (accent_token IN (
    'orange','red','green','slate','blue','sky','amber','violet','teal','emerald','indigo','rose'
  )),
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- Visible Official Seats (super_admin lives strictly in Worker secret SUPER_ADMIN_EMAIL)
CREATE TABLE office_seats (
  seat_code      TEXT PRIMARY KEY NOT NULL,
  branch         TEXT NOT NULL CHECK (branch IN ('EXECUTIVE_BOARD', 'STANDING_COMMITTEE', 'SUPPORT_DIVISION')),
  title          TEXT NOT NULL,
  tier           TEXT NOT NULL CHECK (tier IN ('eb_president', 'eb', 'officer_sd_ops', 'officer_sc', 'officer_sd')),
  assigned_email TEXT NOT NULL UNIQUE,
  is_active      INTEGER NOT NULL DEFAULT 1,
  updated_at     TEXT NOT NULL
);

-- Seat-to-Org-Unit booking scopes (e.g. LEO & LORE -> SCOPE + SCORE)
CREATE TABLE seat_allowed_units (
  seat_code   TEXT NOT NULL REFERENCES office_seats(seat_code) ON DELETE CASCADE,
  org_unit_id TEXT NOT NULL REFERENCES org_units(id) ON DELETE RESTRICT,
  PRIMARY KEY (seat_code, org_unit_id)
);

-- Seat & Org-Unit Governance Audit Log
CREATE TABLE seat_audit_log (
  id          TEXT PRIMARY KEY NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('SEAT', 'ORG_UNIT')),
  target_id   TEXT NOT NULL,
  actor_id    TEXT NOT NULL,
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,
  diff_json   TEXT NOT NULL,
  request_id  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_seat_audit_target ON seat_audit_log(target_type, target_id, created_at DESC);

-- Content Calendar Slots (3-state lifecycle; seat-scoped edit ownership via owner_seat_code)
CREATE TABLE post_slots (
  id                TEXT PRIMARY KEY NOT NULL,
  post_date         TEXT,
  status            TEXT NOT NULL CHECK (status IN ('BOOKED', 'PENDING_RELOCATION', 'CANCELLED')),
  org_unit_id       TEXT NOT NULL REFERENCES org_units(id) ON DELETE RESTRICT,
  content_type      TEXT NOT NULL CHECK (content_type IN ('POST', 'PHOTO', 'REEL', 'COLLAB', 'STORY_CAMPAIGN')),
  title             TEXT NOT NULL,
  notes             TEXT,
  asset_url         TEXT,
  relocation_reason TEXT,
  previous_date     TEXT,
  owner_seat_code   TEXT NOT NULL,
  created_by_id     TEXT NOT NULL,
  created_by_name   TEXT NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  last_mutation_id  TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  CHECK (
    (status = 'BOOKED' AND post_date IS NOT NULL) OR
    (status = 'PENDING_RELOCATION' AND post_date IS NULL) OR
    (status = 'CANCELLED')
  )
);

-- Hard 1-post-per-Cairo-day invariant
CREATE UNIQUE INDEX uq_active_post_date
  ON post_slots(post_date)
  WHERE status = 'BOOKED';

CREATE INDEX idx_post_slots_status_date ON post_slots(status, post_date);
CREATE INDEX idx_post_slots_owner_seat ON post_slots(owner_seat_code, status);

-- Idempotency store (24h TTL)
CREATE TABLE idempotency_keys (
  key           TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  route         TEXT NOT NULL,
  request_hash  TEXT NOT NULL,
  response_code INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  PRIMARY KEY (key, user_id, route)
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Append-Only Slot Audit Log (raw actor_id & actor_role stored; masked in DTO projection for non-super_admin)
CREATE TABLE slot_audit_log (
  id         TEXT PRIMARY KEY NOT NULL,
  slot_id    TEXT NOT NULL REFERENCES post_slots(id) ON DELETE CASCADE,
  actor_id   TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('BOOKED', 'UPDATED', 'QUEUED_RELOCATION', 'RELOCATED', 'CANCELLED', 'ADMIN_OVERRIDE')),
  diff_json  TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_slot_audit_slot_time ON slot_audit_log(slot_id, created_at DESC);
