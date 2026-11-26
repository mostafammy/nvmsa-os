# Calendar Pages (`src/client/modules/calendar/pages`)

## Overview
Implements the top-level `CalendarPage` view coordinating monthly grid and agenda modes, committee/entity filtering, relocation queue drawer access, and day slot booking/editing sheets.

## Interface
- `CalendarPage` (`[CalendarPage.tsx:CalendarPage]`): Page component integrating `useCalendarMonth`, `useOptimisticBooking`, `CalendarGrid`, `BookingSheet`, `RelocationDrawer`, and an inline agenda list view.

## Invariants
- `[CalendarPage.tsx:CalendarPage]`: Computes `bookedDates` and `selectedSlot` from the unfiltered `slotsByDate` map (even when `entityFilter` is active) so occupancy checks remain accurate; sorts `agendaSlots` ascending by `postDate.localeCompare`; sets `isBusy` when any of the four mutations has `isPending === true`; and gates the Relocation Queue button behind `<RoleGate minimumRole="eb">` with a `Read-Only` `Badge` fallback.

## Side Effects
- `[CalendarPage.tsx:CalendarPage]`: Updates local UI state (`selectedDate`, `queueOpen`, `viewMode`, `entityFilter`) and invokes `bookMutation.mutateAsync`, `updateMutation.mutateAsync`, `relocateMutation.mutateAsync`, and `cancelMutation.mutateAsync` through modal callbacks.

## Verification
- Run: `pnpm test`
