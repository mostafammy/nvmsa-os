-- Add optimistic concurrency version column and append-only audit log table

ALTER TABLE calendar_slots ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS calendar_slot_audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  slot_id TEXT NOT NULL REFERENCES calendar_slots(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  previous_date TEXT,
  next_date TEXT,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS calendar_slot_audit_slot_idx
  ON calendar_slot_audit_logs (slot_id, created_at);
