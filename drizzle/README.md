# drizzle

## Overview
SQLite / Cloudflare D1 DDL migration package for NVMSA OS (`0000_init_calendar.sql` and `0001_audit_and_versioning.sql`). It provisions the Better Auth identity/session schema, the content calendar slot schema with DB-level single-booked-post-per-date concurrency indexing, optimistic concurrency versioning, and an append-only slot audit log table.

## Interface
- `[0000_init_calendar.sql:user]` — Table `user` with columns: `id` (`TEXT PRIMARY KEY NOT NULL`), `name` (`TEXT NOT NULL`), `email` (`TEXT NOT NULL UNIQUE`), `email_verified` (`INTEGER NOT NULL DEFAULT 0`), `image` (`TEXT`), `role` (`TEXT NOT NULL DEFAULT 'officer'`), `entity_code` (`TEXT`), `created_at` (`INTEGER NOT NULL`), `updated_at` (`INTEGER NOT NULL`).
- `[0000_init_calendar.sql:session]` — Table `session` with columns: `id` (`TEXT PRIMARY KEY NOT NULL`), `expires_at` (`INTEGER NOT NULL`), `token` (`TEXT NOT NULL UNIQUE`), `created_at` (`INTEGER NOT NULL`), `updated_at` (`INTEGER NOT NULL`), `ip_address` (`TEXT`), `user_agent` (`TEXT`), `user_id` (`TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`).
- `[0000_init_calendar.sql:account]` — Table `account` with columns: `id` (`TEXT PRIMARY KEY NOT NULL`), `account_id` (`TEXT NOT NULL`), `provider_id` (`TEXT NOT NULL`), `user_id` (`TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`), `access_token` (`TEXT`), `refresh_token` (`TEXT`), `id_token` (`TEXT`), `access_token_expires_at` (`INTEGER`), `refresh_token_expires_at` (`INTEGER`), `scope` (`TEXT`), `password` (`TEXT`), `created_at` (`INTEGER NOT NULL`), `updated_at` (`INTEGER NOT NULL`).
- `[0000_init_calendar.sql:verification]` — Table `verification` with columns: `id` (`TEXT PRIMARY KEY NOT NULL`), `identifier` (`TEXT NOT NULL`), `value` (`TEXT NOT NULL`), `expires_at` (`INTEGER NOT NULL`), `created_at` (`INTEGER`), `updated_at` (`INTEGER`).
- `[0000_init_calendar.sql:calendar_slots]` & `[0001_audit_and_versioning.sql:calendar_slots]` — Table `calendar_slots` with columns: `id` (`TEXT PRIMARY KEY NOT NULL`), `post_date` (`TEXT NOT NULL`), `title` (`TEXT NOT NULL`), `entity_code` (`TEXT NOT NULL`), `format` (`TEXT NOT NULL DEFAULT 'poster'`), `status` (`TEXT NOT NULL DEFAULT 'booked'`), `notes` (`TEXT`), `relocation_reason` (`TEXT`), `creator_id` (`TEXT NOT NULL`), `creator_name` (`TEXT NOT NULL`), `created_at` (`TEXT NOT NULL`), `updated_at` (`TEXT NOT NULL`), plus `version` (`INTEGER NOT NULL DEFAULT 1`, added via `ALTER TABLE calendar_slots ADD COLUMN`).
- `[0000_init_calendar.sql:calendar_slots_booked_date_uidx]` — Partial unique index `calendar_slots_booked_date_uidx` on `calendar_slots (post_date) WHERE status = 'booked'`.
- `[0000_init_calendar.sql:calendar_slots_status_date_idx]` — Composite index `calendar_slots_status_date_idx` on `calendar_slots (status, post_date)`.
- `[0001_audit_and_versioning.sql:calendar_slot_audit_logs]` — Table `calendar_slot_audit_logs` with columns: `id` (`TEXT PRIMARY KEY NOT NULL`), `slot_id` (`TEXT NOT NULL REFERENCES calendar_slots(id) ON DELETE CASCADE`), `action` (`TEXT NOT NULL`), `actor_id` (`TEXT NOT NULL`), `actor_name` (`TEXT NOT NULL`), `actor_role` (`TEXT NOT NULL`), `previous_date` (`TEXT`), `next_date` (`TEXT`), `reason` (`TEXT`), `created_at` (`TEXT NOT NULL`).
- `[0001_audit_and_versioning.sql:calendar_slot_audit_slot_idx]` — Composite index `calendar_slot_audit_slot_idx` on `calendar_slot_audit_logs (slot_id, created_at)`.

## Invariants
- `[0000_init_calendar.sql:user]` — `id` is `PRIMARY KEY NOT NULL`; `email` is `NOT NULL UNIQUE`; `email_verified` defaults to `0` (`NOT NULL`), `role` defaults to `'officer'` (`NOT NULL`), and `name`, `created_at`, `updated_at` are `NOT NULL`.
- `[0000_init_calendar.sql:session]` — `id` is `PRIMARY KEY NOT NULL`; `token` is `NOT NULL UNIQUE`; `user_id` is `NOT NULL` and enforces foreign key `REFERENCES user(id) ON DELETE CASCADE`; `expires_at`, `created_at`, `updated_at` are `NOT NULL`.
- `[0000_init_calendar.sql:account]` — `id` is `PRIMARY KEY NOT NULL`; `user_id` is `NOT NULL` and enforces foreign key `REFERENCES user(id) ON DELETE CASCADE`; `account_id`, `provider_id`, `created_at`, `updated_at` are `NOT NULL`.
- `[0000_init_calendar.sql:verification]` — `id` is `PRIMARY KEY NOT NULL`; `identifier`, `value`, and `expires_at` are `NOT NULL`.
- `[0000_init_calendar.sql:calendar_slots]` — `id` is `PRIMARY KEY NOT NULL`; `format` defaults to `'poster'` (`NOT NULL`), `status` defaults to `'booked'` (`NOT NULL`), and `post_date`, `title`, `entity_code`, `creator_id`, `creator_name`, `created_at`, `updated_at` are `NOT NULL`.
- `[0000_init_calendar.sql:calendar_slots_booked_date_uidx]` — Partial unique index `ON calendar_slots (post_date) WHERE status = 'booked'` guarantees at most one active `'booked'` post per `post_date` at the database level.
- `[0001_audit_and_versioning.sql:calendar_slots]` — `version` is `INTEGER NOT NULL DEFAULT 1` for optimistic concurrency tracking.
- `[0001_audit_and_versioning.sql:calendar_slot_audit_logs]` — `id` is `PRIMARY KEY NOT NULL`; `slot_id` is `NOT NULL` and enforces foreign key `REFERENCES calendar_slots(id) ON DELETE CASCADE`; `action`, `actor_id`, `actor_name`, `actor_role`, and `created_at` are `NOT NULL`.

## Side Effects
- `[0000_init_calendar.sql:user]`, `[0000_init_calendar.sql:session]`, `[0000_init_calendar.sql:account]`, `[0000_init_calendar.sql:verification]`, `[0000_init_calendar.sql:calendar_slots]` — Executes `CREATE TABLE IF NOT EXISTS` DDL statements against the target D1/SQLite database and registers `ON DELETE CASCADE` foreign-key cascades from `user(id)` to `session(user_id)` and `account(user_id)`.
- `[0000_init_calendar.sql:calendar_slots_booked_date_uidx]`, `[0000_init_calendar.sql:calendar_slots_status_date_idx]` — Executes `CREATE UNIQUE INDEX IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` on `calendar_slots`.
- `[0001_audit_and_versioning.sql:calendar_slots]` — Executes `ALTER TABLE calendar_slots ADD COLUMN version INTEGER NOT NULL DEFAULT 1`, mutating the existing `calendar_slots` schema and populating `version = 1` for existing rows.
- `[0001_audit_and_versioning.sql:calendar_slot_audit_logs]` — Executes `CREATE TABLE IF NOT EXISTS calendar_slot_audit_logs` and registers an `ON DELETE CASCADE` foreign-key cascade from `calendar_slots(id)` to `calendar_slot_audit_logs(slot_id)`.
- `[0001_audit_and_versioning.sql:calendar_slot_audit_slot_idx]` — Executes `CREATE INDEX IF NOT EXISTS` on `calendar_slot_audit_logs (slot_id, created_at)`.

## Verification
- Run: `pnpm test`
