# Calendar Components (`src/client/modules/calendar/components`)

## Overview
Contains the presentational and interactive UI components for the content calendar module: the 7-column month grid, individual day tiles, slot booking/editing sheet, and relocation queue drawer.

## Interface
- `BookingSheet` (`[BookingSheet.tsx:BookingSheet]`): Bottom sheet modal supporting read-only slot inspection, new slot creation, creator/admin editing, move-to-queue relocation, and two-step cancellation.
- `CalendarGrid` (`[CalendarGrid.tsx:CalendarGrid]`): Renders month navigation controls, weekday column labels (`WEEKDAYS`), syncing indicator, and a 7-column grid of `DayCell` buttons.
- `DayCell` (`[DayCell.tsx:DayCell]`): Renders a single calendar day button showing day number, today highlight ring, and either the booked entity badge/title or an `Open` indicator.
- `RelocationDrawer` (`[RelocationDrawer.tsx:RelocationDrawer]`): Bottom sheet listing queued posts (`ManagedSlotView[]`) with date pickers and `Assign Date` actions for rescheduling onto unoccupied dates.

## Invariants
- `[BookingSheet.tsx:BookingSheet]`: Returns `null` when `selectedDate` is null; requires `hasMinimumRole(user.role, 'eb')` to book (`canBook`), restricts editing/relocating/canceling (`canEdit`) to `'admin'` or matching `slot.creatorId` (`isManagedSlot`), prevents non-admins from booking past Cairo dates (`selectedDate < getTodayCairoDate()`), and sends `expectedVersion` only when `isManagedSlot(slot)` holds.
- `[RelocationDrawer.tsx:RelocationDrawer]`: Restricts reassignment controls (`canManage`) to `'admin'` or `user.id === item.creatorId`, sets `min={todayCairo}` on non-admin date inputs, checks `bookedDates.has(pickedDate)`, and disables submission unless a valid unoccupied date is chosen and `!isBusy`.
- `[DayCell.tsx:DayCell]`: Resolves colors and badge classes from `NVMSA_ENTITY_MAP[slot.entityCode]` and renders `'Open'` only when `!slot && cell.inCurrentMonth`.
- `[CalendarGrid.tsx:CalendarGrid]`: Indexes `slotsByDate.get(cell.isoDate)` and marks `cell.isoDate === todayCairo` across a 7-column (`grid-cols-7`) layout.

## Side Effects
- `[BookingSheet.tsx:BookingSheet]`: Resets and mutates local form/confirmation state (`title`, `entityCode`, `format`, `notes`, `relocationReason`, `showRelocateForm`, `confirmCancel`), awaits `onBook`, `onUpdate`, `onQueueRelocation`, or `onCancel`, and invokes `onClose()`.
- `[RelocationDrawer.tsx:RelocationDrawer]`: Tracks per-item `targetDates` in React state and awaits `onReschedule(item.id, pickedDate, ..., item.version)`.
- `[CalendarGrid.tsx:CalendarGrid]`, `[DayCell.tsx:DayCell]`: Trigger `onPrevMonth`, `onNextMonth`, `onToday`, and `onSelectDate` / `onSelect` callbacks on user interaction.

## Verification
- Run: `pnpm test`
