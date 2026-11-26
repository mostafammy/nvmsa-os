# Shared

## Overview
Top-level shared domain package unifying NVMSA constants, Zod validation schemas, inferred TypeScript types, and Cairo/UTC date utilities via a single barrel entry point (`index.ts`) consumed across application boundaries.

## Interface
- `[index.ts]` — Re-exports all public symbols via `export *` from `./constants`, `./schemas`, `./types`, and `./utils`:
  - Constants (`./constants`): `STANDING_COMMITTEES`, `StandingCommitteeCode`, `STANDING_COMMITTEE_CODES`, `SUPPORT_DIVISIONS`, `SupportDivisionCode`, `SUPPORT_DIVISION_CODES`, `USER_ROLES`, `UserRole`, `ROLE_LABELS`, `ROLE_RANK`, `hasMinimumRole`, `NVMSA_ENTITIES`, `NvmsaEntityCode`, `NVMSA_ENTITY_CODES`, `NVMSA_ENTITY_MAP`.
  - Schemas (`./schemas`): `UserRoleSchema`, `SessionUserSchema`, `SignInInputSchema`, `SignUpInputSchema`, `IsoDateSchema`, `YearMonthSchema`, `SlotStatusSchema`, `PostFormatSchema`, `NvmsaEntityCodeSchema`, `SlotAuditActionSchema`, `PublicSlotViewSchema`, `ManagedSlotViewSchema`, `SlotAuditLogEntrySchema`, `CreateSlotInputSchema`, `UpdateSlotInputSchema`, `RelocateSlotInputSchema`, `CalendarMonthResponseSchema`.
  - Types (`./types`): `SessionUser`, `SignInInput`, `SignUpInput`, `SlotStatus`, `PostFormat`, `SlotAuditAction`, `SlotAuditLogEntry`, `PublicSlotView`, `ManagedSlotView`, `CreateSlotInput`, `UpdateSlotInput`, `RelocateSlotInput`, `CalendarMonthResponse`.
  - Utils (`./utils`): `CAIRO_TIMEZONE`, `getTodayCairoDate`, `getCurrentCairoMonth`, `isValidIsoDate`, `getMonthDateBounds`, `shiftYearMonth`, `formatMonthHeading`, `formatShortDayLabel`, `CalendarGridCell`, `buildMonthGrid`.
- Subdirectories:
  - [constants](./constants/README.md) — Standing committees, support divisions, unified entity map, and role rank hierarchy.
  - [schemas](./schemas/README.md) — Zod runtime schemas for auth payloads and content calendar slots/commands.
  - [types](./types/README.md) — TypeScript types inferred from `schemas` via `z.infer`.
  - [utils](./utils/README.md) — `Africa/Cairo` timezone lookups, ISO date validation, and UTC calendar grid utilities.

## Invariants
- `[index.ts]` — Uses wildcard barrel re-exports (`export *`) across `./constants`, `./schemas`, `./types`, and `./utils`; exported symbol names across those four child modules must remain distinct to avoid re-export ambiguity.
- Child contracts govern canonical entity/role constants (`./constants/README.md`), schema constraints (`./schemas/README.md`), `z.infer` type alignment (`./types/README.md`), and `Africa/Cairo` / UTC calendar date rules (`./utils/README.md`).

## Side Effects
- None

## Verification
- Run: `pnpm test`
