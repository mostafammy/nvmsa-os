# Calendar API Queries (`src/client/modules/calendar/api`)

## Overview
Provides React Query key factories, SWR cache lookup, and typed Hono RPC client wrappers for fetching, creating, updating, relocating, and canceling calendar slots.

## Interface
- `calendarKeys` (`[calendar.queries.ts:calendarKeys]`): Query key factory `{ month: (yearMonth: string) => ['calendar', 'month', yearMonth] }`.
- `fetchCalendarMonth` (`[calendar.queries.ts:fetchCalendarMonth]`): Fetches monthly calendar slots and relocation queue via `GET /api/calendar/slots?month=...`.
- `getCachedCalendarMonth` (`[calendar.queries.ts:getCachedCalendarMonth]`): Reads cached `CalendarMonthResponse` for a month from SWR storage.
- `createCalendarSlot` (`[calendar.queries.ts:createCalendarSlot]`): Books a new slot via `POST /api/calendar/slots`.
- `updateCalendarSlot` (`[calendar.queries.ts:updateCalendarSlot]`): Updates an existing slot via `PATCH /api/calendar/slots/:id`.
- `relocateCalendarSlot` (`[calendar.queries.ts:relocateCalendarSlot]`): Moves or reschedules a slot via `POST /api/calendar/slots/:id/relocate`.
- `cancelCalendarSlot` (`[calendar.queries.ts:cancelCalendarSlot]`): Cancels a slot via `DELETE /api/calendar/slots/:id`.

## Invariants
- `[calendar.queries.ts:fetchCalendarMonth]`, `[calendar.queries.ts:createCalendarSlot]`, `[calendar.queries.ts:updateCalendarSlot]`, `[calendar.queries.ts:relocateCalendarSlot]`, `[calendar.queries.ts:cancelCalendarSlot]`: Every request checks `!res.ok` and throws an `Error` parsed via `extractErrorMessage` (`body.error?.message` or per-operation fallback message).
- `[calendar.queries.ts:fetchCalendarMonth]`, `[calendar.queries.ts:getCachedCalendarMonth]`: Both read and write under the deterministic SWR cache key ``calendar:${month}``.

## Side Effects
- `[calendar.queries.ts:fetchCalendarMonth]`: Executes an HTTP `GET` request via `apiClient.api.calendar.slots.$get` and persists the parsed `CalendarMonthResponse` to `localStorage` via `writeSwrCache`.
- `[calendar.queries.ts:getCachedCalendarMonth]`: Reads `localStorage` via `readSwrCache`.
- `[calendar.queries.ts:createCalendarSlot]`, `[calendar.queries.ts:updateCalendarSlot]`, `[calendar.queries.ts:relocateCalendarSlot]`, `[calendar.queries.ts:cancelCalendarSlot]`: Execute HTTP `POST`, `PATCH`, `POST` (relocate), and `DELETE` requests to `/api/calendar/slots` endpoints via `apiClient`.

## Verification
- Run: `pnpm test`
