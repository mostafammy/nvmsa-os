# Schemas

## Overview
Zod runtime validation schemas defining authentication payloads and 1-post-per-day content calendar DTOs and write commands. All role and entity enumerations are grounded directly in `../constants`.

## Interface
- `[index.ts]` — Re-exports all schemas from `./auth.schema` and `./calendar.schema`.
- `[auth.schema.ts:UserRoleSchema]` — `z.enum(USER_ROLES)` schema for `'officer' | 'eb' | 'admin'`.
- `[auth.schema.ts:SessionUserSchema]` — Object schema for authenticated session users (`id`, `name`, `email`, `role`, optional nullable `entityCode`).
- `[auth.schema.ts:SignInInputSchema]` — Object schema validating sign-in credentials (`email`, `password` min length `8`).
- `[auth.schema.ts:SignUpInputSchema]` — Object schema validating sign-up inputs (`name` trimmed 2–80 chars, `email`, `password` 8–128 chars).
- `[calendar.schema.ts:IsoDateSchema]` — String schema matching `/^\d{4}-\d{2}-\d{2}$/` (`YYYY-MM-DD`).
- `[calendar.schema.ts:YearMonthSchema]` — String schema matching `/^\d{4}-\d{2}$/` (`YYYY-MM`).
- `[calendar.schema.ts:SlotStatusSchema]` — Enum schema for `'booked' | 'relocation_queue' | 'cancelled'`.
- `[calendar.schema.ts:PostFormatSchema]` — Enum schema for `'poster' | 'carousel' | 'reel' | 'story' | 'announcement'`.
- `[calendar.schema.ts:NvmsaEntityCodeSchema]` — `z.enum(NVMSA_ENTITY_CODES)` schema.
- `[calendar.schema.ts:SlotAuditActionSchema]` — Enum schema for `'booked' | 'updated' | 'queued_for_relocation' | 'relocated' | 'cancelled'`.
- `[calendar.schema.ts:PublicSlotViewSchema]` — ISP read DTO schema for Officers (`id`, `postDate`, `title`, `entityCode`, `format`, `status`, `creatorName`).
- `[calendar.schema.ts:ManagedSlotViewSchema]` — Extended read DTO schema for EB Members and Admins extending `PublicSlotViewSchema` with `creatorId`, `notes`, `relocationReason`, `version`, `createdAt`, and `updatedAt`.
- `[calendar.schema.ts:SlotAuditLogEntrySchema]` — Audit log entry schema (`id`, `slotId`, `action`, `actorId`, `actorName`, `actorRole`, `previousDate`, `nextDate`, `reason`, `createdAt`).
- `[calendar.schema.ts:CreateSlotInputSchema]` — Write command schema for booking a slot (`postDate`, `title`, `entityCode`, `format` defaulting to `'poster'`, optional nullable `notes`).
- `[calendar.schema.ts:UpdateSlotInputSchema]` — Write command schema for editing a slot (`title`, `entityCode`, `format`, `notes`, `expectedVersion`) with a `.refine()` check requiring at least one update field.
- `[calendar.schema.ts:RelocateSlotInputSchema]` — Write command schema for queuing or rescheduling a slot (`targetDate`, `reason`, `expectedVersion`).
- `[calendar.schema.ts:CalendarMonthResponseSchema]` — Monthly calendar response schema (`month`, `slots`, `relocationQueue`).

## Invariants
- `[auth.schema.ts:UserRoleSchema]`, `[auth.schema.ts:SessionUserSchema]`, `[calendar.schema.ts:NvmsaEntityCodeSchema]`, `[calendar.schema.ts:SlotAuditLogEntrySchema]` — Role and entity code enums must stay bound to `USER_ROLES` and `NVMSA_ENTITY_CODES` from `../constants`.
- `[auth.schema.ts:SessionUserSchema]`, `[auth.schema.ts:SignInInputSchema]`, `[auth.schema.ts:SignUpInputSchema]` — `id` and `name` in `SessionUserSchema` require `min(1)`, emails require `.email()`, sign-in passwords require `min(8)`, and sign-up enforces trimmed `name` (2–80 chars) and `password` (8–128 chars).
- `[calendar.schema.ts:IsoDateSchema]`, `[calendar.schema.ts:YearMonthSchema]` — Enforce `YYYY-MM-DD` and `YYYY-MM` syntax via regex; calendar validity (e.g., leap days) is not enforced by these regex schemas alone.
- `[calendar.schema.ts:CreateSlotInputSchema]` — Trims `title` (`min(3)`, `max(120)`), defaults `format` to `'poster'`, and limits trimmed `notes` to `max(500)`.
- `[calendar.schema.ts:UpdateSlotInputSchema]` — Rejects payloads where all of `title`, `entityCode`, `format`, and `notes` are `undefined` (`'At least one field must be provided to update'`); `expectedVersion`, when provided, must be a positive integer.
- `[calendar.schema.ts:RelocateSlotInputSchema]` — Requires trimmed `reason` (3–280 chars) and positive integer `expectedVersion` when provided.
- `[calendar.schema.ts:ManagedSlotViewSchema]` — Enforces `version` as a positive integer and separates privileged fields (`creatorId`, `notes`, `relocationReason`, `createdAt`, `updatedAt`) from `PublicSlotViewSchema`.

## Side Effects
- None

## Verification
- Run: `pnpm test`
