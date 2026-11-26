# Calendar Feature Module (`src/client/modules/calendar`)

## Overview
Feature module implementing the 1-post-per-day NVMSA content calendar, bundling typed API queries, optimistic React Query hooks, grid/drawer/sheet UI components, and the top-level `CalendarPage`.

## Interface
- `CalendarPage` (`[index.ts:CalendarPage]`): Re-exported entry page component from `./pages/CalendarPage`.
- Subdirectories:
  - [Calendar API Queries](./api/README.md): Exposes `calendarKeys`, `fetchCalendarMonth`, `getCachedCalendarMonth`, `createCalendarSlot`, `updateCalendarSlot`, `relocateCalendarSlot`, and `cancelCalendarSlot`.
  - [Calendar Components](./components/README.md): Exposes `BookingSheet`, `CalendarGrid`, `DayCell`, and `RelocationDrawer`.
  - [Calendar Hooks](./hooks/README.md): Exposes `CalendarSlotView`, `useCalendarMonth`, and `useOptimisticBooking`.
  - [Calendar Pages](./pages/README.md): Exposes `CalendarPage`.

## Invariants
- `[index.ts:CalendarPage]`: Exports `CalendarPage` as the sole public module entrypoint consumed lazily by the OS module registry (`src/client/app/modules.registry.ts`).

## Side Effects
- None in `[index.ts]`; runtime network, storage, query-cache, and UI state side effects reside in `./api/README.md`, `./hooks/README.md`, `./components/README.md`, and `./pages/README.md`.

## Verification
- Run: `pnpm test`
