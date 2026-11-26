# Calendar Hooks (`src/client/modules/calendar/hooks`)

## Overview
Provides React Query hooks for loading monthly calendar state from the API/SWR cache and performing optimistic bookings, updates, relocations, and cancellations with toast feedback.

## Interface
- `CalendarSlotView` (`[useCalendarMonth.ts:CalendarSlotView]`): Exported union type `PublicSlotView | ManagedSlotView`.
- `useCalendarMonth` (`[useCalendarMonth.ts:useCalendarMonth]`): Manages active `month` state, fetches monthly slots and relocation queue via `useQuery`, builds `gridCells` and `slotsByDate`, and exposes `goToPrevMonth`, `goToNextMonth`, and `goToToday`.
- `useOptimisticBooking` (`[useOptimisticBooking.ts:useOptimisticBooking]`): Returns `{ bookMutation, updateMutation, relocateMutation, cancelMutation }` backed by React Query `useMutation`.

## Invariants
- `[useCalendarMonth.ts:useCalendarMonth]`: Initializes `month` from `getCurrentCairoMonth()`, derives `todayCairo` via `getTodayCairoDate()`, shifts months via `shiftYearMonth`, indexes `slotsByDate` as a `Map<string, CalendarSlotView>` keyed by `slot.postDate`, and seeds `useQuery` via `initialData: () => getCachedCalendarMonth(month)`.
- `[useOptimisticBooking.ts:useOptimisticBooking]`: In `bookMutation.onMutate`, cancels in-flight queries on `calendarKeys.month(month)` and inserts an optimistic slot (`id: 'optimistic-${input.postDate}'`, `status: 'booked'`, `version: 1`) only when both cached `previous` data and `user` exist; rolls back to `context.previous` in `onError`.
- `[useOptimisticBooking.ts:useOptimisticBooking]`: Invalidates `calendarKeys.month(month)` on settle for book/update/cancel mutations, and invalidates prefix `['calendar', 'month']` across all cached months in `relocateMutation.onSettled`.

## Side Effects
- `[useCalendarMonth.ts:useCalendarMonth]`: Triggers `fetchCalendarMonth(month)` network requests, reads SWR cache (`getCachedCalendarMonth`), and updates local `month` React state on navigation.
- `[useOptimisticBooking.ts:useOptimisticBooking]`: Executes slot mutations (`createCalendarSlot`, `updateCalendarSlot`, `relocateCalendarSlot`, `cancelCalendarSlot`), mutates React Query cache (`cancelQueries`, `setQueryData`, `invalidateQueries`), and triggers toast notifications via `useToast().pushToast(...)`.

## Verification
- Run: `pnpm test`
