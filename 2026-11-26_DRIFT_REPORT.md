# EGM Drift Report — 2026-11-26

Target: All 32 EGM-bootstrapped `README.md` contracts in `/Users/mac/Documents/NVMSA OS` verified directly against local source files.

## README.md

- **Doc-to-Code Divergence (`Role & Permission Matrix`, line 71)**: Documents `"Move slot to Relocation Queue / Override slot | No | Own only | Any slot"`. In code, `CalendarPolicy.canOverrideSlot` (`src/server/modules/calendar/calendar.policy.ts:41-43`) is used solely by `CalendarService.assertNotPastDateForRole` (`src/server/modules/calendar/calendar.service.ts:69-76`) to permit Admins to book or relocate onto past Cairo dates. Neither `bookSlot` nor `relocateSlot` implements an Admin displacement override for already-booked dates (both throw `ConflictError`).
- **Doc-to-Code Divergence (`Adding a New Module`, line 76)**: Instructs contributors to create `service.test.ts` in `src/server/modules/<module>/`, whereas `src/server/modules/calendar/` uses `<module>.service.test.ts`, `<module>.routes.test.ts`, and an `index.ts` barrel (`calendar/index.ts`) re-exporting `calendarRoutes` and `calendarSlots`.
- **Invariant Nuance (`Global Invariants`, line 110)**: States updates with `expectedVersion` increment `version + 1` and throw `ConflictError` on mismatch, omitting that `expectedVersion` is optional in `UpdateSlotInputSchema` / `RelocateSlotInputSchema` and is not accepted or forwarded by `CalendarService.cancelSlot` (`src/server/modules/calendar/calendar.service.ts:311-349`).
- **Missing Code Coverage (`Local Interface & Invariants`)**: `eslint.config.js` also configures global `ignores: ['dist', '.wrangler', 'node_modules', 'drizzle']`, extends `@eslint/js` and `typescript-eslint` recommended rules, and enables `eslint-plugin-react-hooks` recommended rules on `src/client/**/*.{ts,tsx}`, which are omitted from the `eslint.config.js` summary (`line 92`). Root files `package.json`, `pnpm-workspace.yaml`, `.dev.vars.example`, and `index.html` appear only in the Directory Map.

## drizzle/README.md

No drift detected.

## public/README.md

- **Doc-to-Code Precision Drift (`Invariants`, line 19)**: Describes *"Successful network responses are cloned via `response.clone()` into `copy`"*. In `public/sw.js:27-32`, the fetch promise `.then((response) => ...)` performs no `response.ok` or status check—every resolved HTTP response (including 4xx/5xx responses) is cloned and stored in `CACHE_NAME` via `cache.put(request, copy)`.

## src/README.md

No drift detected.

## src/shared/README.md

No drift detected.

## src/shared/constants/README.md

No drift detected.

## src/shared/schemas/README.md

No drift detected.

## src/shared/types/README.md

No drift detected.

## src/shared/utils/README.md

No drift detected.

## src/server/README.md

No drift detected.

## src/server/core/README.md

No drift detected.

## src/server/core/auth/README.md

No drift detected.

## src/server/core/config/README.md

No drift detected.

## src/server/core/db/README.md

No drift detected.

## src/server/core/errors/README.md

No drift detected.

## src/server/core/middleware/README.md

No drift detected.

## src/server/modules/README.md

No drift detected.

## src/server/modules/calendar/README.md

- **Missing Code Coverage (`Invariants`)**: Does not explicitly note that `CalendarService.cancelSlot` (`src/server/modules/calendar/calendar.service.ts:311-349`) calls `this.repo.update` without passing `expectedVersion` (unlike `updateSlot` and `relocateSlot`), or that `D1SlotRepository.update` (`src/server/modules/calendar/calendar.repository.ts:119-128`) returns `null` when `!updated && expectedVersion === undefined`.

## src/client/README.md

No drift detected.

## src/client/app/README.md

No drift detected.

## src/client/app/layout/README.md

No drift detected.

## src/client/core/README.md

No drift detected.

## src/client/core/api/README.md

No drift detected.

## src/client/core/auth/README.md

- **Missing Code Coverage (`Invariants` / `Side Effects`)**: Does not document that `SignInSheet` clears `password` (`setPassword('')`) on successful sign-in (`src/client/core/auth/SignInSheet.tsx:26`), or that `AuthProvider.signOut` (`src/client/core/auth/useSession.tsx:86-97`) invalidates React Query and clears `nvmsa_os_dev_persona` without purging `nvmsa_os_swr:*` entries from `localStorage`.

## src/client/core/storage/README.md

No drift detected.

## src/client/modules/README.md

No drift detected.

## src/client/modules/calendar/README.md

No drift detected.

## src/client/modules/calendar/api/README.md

No drift detected.

## src/client/modules/calendar/components/README.md

- **Missing Code Coverage (`Invariants`)**: Does not detail `BookingSheet` input constraints (`title` `minLength={3}`/`maxLength={120}`, `notes` `maxLength={500}`, `relocationReason` `minLength={3}`/`maxLength={280}`, whitespace trim guards in `handleSubmit` / `handleQueueRelocation`) or `DayCell`'s committee indicator dot (`entity?.color ?? '#0f766e'` in `src/client/modules/calendar/components/DayCell.tsx:39-45`).

## src/client/modules/calendar/hooks/README.md

- **Missing Code Coverage (`Invariants`)**: Does not note that `useCalendarMonth` memoizes `todayCairo` with an empty dependency array (`useMemo(() => getTodayCairoDate(), [])` in `src/client/modules/calendar/hooks/useCalendarMonth.ts:20`), or that `useOptimisticBooking` binds `queryKey` to the hook's `month` argument (`src/client/modules/calendar/hooks/useOptimisticBooking.ts:22`), causing `bookMutation`/`updateMutation`/`cancelMutation` to mutate/invalidate the viewed month cache even when selecting an adjacent-month overflow cell.

## src/client/modules/calendar/pages/README.md

No drift detected.

## src/client/ui/README.md

No drift detected.
