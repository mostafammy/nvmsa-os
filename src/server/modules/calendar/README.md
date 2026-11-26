# Calendar (`src/server/modules/calendar`)

## Overview
Implements the NVMSA 1-post-per-day editorial content calendar domain module, spanning Drizzle D1 table schemas, authorization policies, D1 and in-memory repositories with optimistic concurrency control, business rules and audit logging in `CalendarService`, and Hono HTTP route handlers.

## Interface
- `[index.ts:calendarRoutes]`: Re-exported Hono router from `./calendar.routes`.
- `[index.ts:calendarSlots]`: Re-exported Drizzle SQLite table from `./calendar.table`.
- `[calendar.table.ts:calendarSlots]`: Drizzle `sqliteTable('calendar_slots', ...)` storing scheduled, queued, and cancelled content slots (`id`, `postDate`, `title`, `entityCode`, `format`, `status`, `notes`, `relocationReason`, `creatorId`, `creatorName`, `version`, `createdAt`, `updatedAt`).
- `[calendar.table.ts:calendarSlotAuditLogs]`: Drizzle `sqliteTable('calendar_slot_audit_logs', ...)` storing append-only slot change history (`id`, `slotId`, `action`, `actorId`, `actorName`, `actorRole`, `previousDate`, `nextDate`, `reason`, `createdAt`).
- `[calendar.table.ts:CalendarSlotRow]`, `[calendar.table.ts:NewCalendarSlotRow]`, `[calendar.table.ts:CalendarSlotAuditRow]`, `[calendar.table.ts:NewCalendarSlotAuditRow]`: Inferred Drizzle select/insert row types.
- `[calendar.policy.ts:CalendarPolicy]`: Authorization policy interface defining `canViewManagedFields`, `canBookSlot`, `canEditSlot`, `canRelocateSlot`, `canCancelSlot`, and `canOverrideSlot`.
- `[calendar.policy.ts:defaultCalendarPolicy]`: Default `CalendarPolicy` implementation.
- `[calendar.repository.ts:SlotUpdatePatch]`: Partial update patch type picking `postDate`, `title`, `entityCode`, `format`, `status`, `notes`, `relocationReason`, and `updatedAt` from `CalendarSlotRow`.
- `[calendar.repository.ts:ISlotRepository]`: Persistence interface declaring `findById`, `findBookedByDate`, `listBookedInRange`, `listRelocationQueue`, `insert`, `update`, `appendAuditLog`, and `listAuditLogs`.
- `[calendar.repository.ts:D1SlotRepository]`: Drizzle/D1 `ISlotRepository` implementation.
- `[calendar.repository.ts:InMemorySlotRepository]`: In-memory `ISlotRepository` implementation backed by a `Map` and array.
- `[calendar.service.ts:CalendarService]`: Application service exposing `listMonth`, `listSlotHistory`, `bookSlot`, `updateSlot`, `relocateSlot`, and `cancelSlot`.
- `[calendar.routes.ts:calendarRoutes]`: `Hono<AppEnv>` router exposing:
  - `GET /slots` (query `month?: YearMonthSchema`, defaults to `getCurrentCairoMonth()`, returns HTTP `200` `CalendarMonthResponse`)
  - `GET /slots/:id/history` (`requireRole('eb')`, returns HTTP `200` `{ history }`)
  - `POST /slots` (`requireRole('eb')`, JSON `CreateSlotInputSchema`, returns HTTP `201` `{ slot }`)
  - `PATCH /slots/:id` (`requireRole('eb')`, JSON `UpdateSlotInputSchema`, returns HTTP `200` `{ slot }`)
  - `POST /slots/:id/relocate` (`requireRole('eb')`, JSON `RelocateSlotInputSchema`, returns HTTP `200` `{ slot }`)
  - `DELETE /slots/:id` (`requireRole('eb')`, returns HTTP `200` `{ slot }`)

## Invariants
- `[calendar.table.ts:calendarSlots]`: Partial unique index `calendar_slots_booked_date_uidx` on `post_date` `WHERE status = 'booked'` enforces at most one booked slot per date at the database level; `id`, `postDate`, `title`, `entityCode`, `format` (default `'poster'`), `status` (default `'booked'`), `creatorId`, `creatorName`, `version` (default `1`), `createdAt`, and `updatedAt` are `notNull()`; `calendar_slots_status_date_idx` indexes `(status, post_date)`.
- `[calendar.table.ts:calendarSlotAuditLogs]`: `slotId` is `notNull()` and references `calendarSlots.id` with `{ onDelete: 'cascade' }`; `id`, `action`, `actorId`, `actorName`, `actorRole`, and `createdAt` are `notNull()`; `calendar_slot_audit_slot_idx` indexes `(slot_id, created_at)`.
- `[calendar.policy.ts:defaultCalendarPolicy]`: `canViewManagedFields` and `canBookSlot` require a non-null user with `hasMinimumRole(user.role, 'eb')`; `canEditSlot`, `canRelocateSlot`, and `canCancelSlot` require `'admin'` or `'eb'` with `slot.creatorId === user.id`; `canOverrideSlot` requires `user.role === 'admin'`.
- `[calendar.repository.ts:D1SlotRepository]`: `insert` and `update` map SQLite unique-constraint errors (`unique constraint failed`, `sqlite_constraint_unique`, `calendar_slots_booked_date_uidx`) to `ConflictError`; `update` atomically increments `version = version + 1`, constrains by `expectedVersion` when provided, and throws `ConflictError` if an existing row failed the version check.
- `[calendar.repository.ts:InMemorySlotRepository]`: Enforces single-booked-slot-per-date uniqueness on `insert` and `update` (`ConflictError`), increments `version` by `1` on `update`, and throws `ConflictError` on `expectedVersion` mismatch.
- `[calendar.service.ts:CalendarService]`:
  - `assertNotPastDateForRole`: Rejects `postDate < getTodayCairoDate(clock())` with `ValidationError` unless `policy.canOverrideSlot(actor)` is true.
  - `listMonth`: Returns `ManagedSlotView` and `listRelocationQueue()` when `policy.canViewManagedFields(actor)` is true; otherwise strips managed fields via `toPublicSlotView` and returns `relocationQueue: []`.
  - `listSlotHistory`: Requires non-null `actor` (`UnauthorizedError`), `canViewManagedFields(actor)` (`ForbiddenError`), and existing slot (`NotFoundError`, including cancelled slots).
  - `bookSlot`: Requires non-null `actor` (`UnauthorizedError`), `canBookSlot(actor)` (`ForbiddenError`), valid calendar date via `isValidIsoDate` (`ValidationError`), non-past Cairo date or admin override, and unoccupied booked date (`ConflictError`); initializes `status: 'booked'` and `version: 1`.
  - `updateSlot`, `relocateSlot`, `cancelSlot`: Treat missing or `status === 'cancelled'` slots as `NotFoundError` and enforce `canEditSlot` / `canRelocateSlot` / `canCancelSlot` (`ForbiddenError`). `relocateSlot` with `targetDate` additionally enforces `isValidIsoDate`, non-past Cairo date or admin override, and absence of another booked slot (`occupying.id !== existing.id`, else `ConflictError`).
- `[calendar.routes.ts:calendarRoutes]`: All write routes and `/slots/:id/history` require `requireRole('eb')`; `GET /slots` validates `month` with `YearMonthSchema` and defaults to `getCurrentCairoMonth()`; JSON payloads are validated with `CreateSlotInputSchema`, `UpdateSlotInputSchema`, and `RelocateSlotInputSchema`.

## Side Effects
- `[calendar.repository.ts:D1SlotRepository]`: Executes SQL `INSERT` and `UPDATE` statements against `calendar_slots` and `calendar_slot_audit_logs` in D1 (`AppDatabase`).
- `[calendar.repository.ts:InMemorySlotRepository]`: Mutates internal `rows` (`Map`) and `logs` (`Array`) structures in memory.
- `[calendar.service.ts:CalendarService]`: Generates UUIDs via `crypto.randomUUID()`, reads `clock()`, creates/updates slot records via `ISlotRepository`, and appends audit log entries (`'booked'`, `'updated'`, `'queued_for_relocation'`, `'relocated'`, or `'cancelled'`).
- `[calendar.routes.ts:createCalendarService]`: Instantiates `createDb(c.env.DB)`, `D1SlotRepository`, and `CalendarService` per HTTP request and serializes Hono JSON responses.

## Verification
- Run: `pnpm test`
