# Utils

## Overview
Shared date, timezone, and calendar grid utilities built around the `Africa/Cairo` timezone for current-date resolution and deterministic UTC date arithmetic for ISO date/month strings.

## Interface
- `[index.ts]` — Re-exports all symbols from `./date`.
- `[date.ts:CAIRO_TIMEZONE]` — Constant string `'Africa/Cairo'`.
- `[date.ts:getTodayCairoDate]` — `getTodayCairoDate(now?: Date): string` returning today's `YYYY-MM-DD` date in `Africa/Cairo`.
- `[date.ts:getCurrentCairoMonth]` — `getCurrentCairoMonth(now?: Date): string` returning the current `YYYY-MM` month in `Africa/Cairo`.
- `[date.ts:isValidIsoDate]` — `isValidIsoDate(value: string): boolean` validating `YYYY-MM-DD` format and real UTC calendar date round-trip.
- `[date.ts:getMonthDateBounds]` — `getMonthDateBounds(yearMonth: string): { start: string; end: string }` returning the first and last `YYYY-MM-DD` dates of a month.
- `[date.ts:shiftYearMonth]` — `shiftYearMonth(yearMonth: string, deltaMonths: number): string` returning the shifted `YYYY-MM` string.
- `[date.ts:formatMonthHeading]` — `formatMonthHeading(yearMonth: string): string` formatting a `YYYY-MM` string in `'en-US'` UTC (e.g., long month name and numeric year).
- `[date.ts:formatShortDayLabel]` — `formatShortDayLabel(isoDate: string): string` formatting a `YYYY-MM-DD` string in `'en-US'` UTC with short weekday, short month, and numeric day.
- `[date.ts:CalendarGridCell]` — Interface `{ isoDate: string; dayNumber: number; inCurrentMonth: boolean }`.
- `[date.ts:buildMonthGrid]` — `buildMonthGrid(yearMonth: string): CalendarGridCell[]` building a Sunday-first calendar grid for a `YYYY-MM` month.

## Invariants
- `[date.ts:CAIRO_TIMEZONE]`, `[date.ts:getTodayCairoDate]`, `[date.ts:getCurrentCairoMonth]` — Current date and month lookups format `now` using `'en-CA'` in `'Africa/Cairo'` (`CAIRO_TIMEZONE`) to yield `YYYY-MM-DD` and `YYYY-MM` strings.
- `[date.ts:isValidIsoDate]` — Checks both `/^\d{4}-\d{2}-\d{2}$/` format and UTC `Date.UTC` component round-trip equality (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`) to reject invalid calendar dates.
- `[date.ts:getMonthDateBounds]`, `[date.ts:shiftYearMonth]`, `[date.ts:formatMonthHeading]`, `[date.ts:formatShortDayLabel]`, `[date.ts:buildMonthGrid]` — Assume hyphen-delimited `YYYY-MM` or `YYYY-MM-DD` inputs and execute all date math and `Intl.DateTimeFormat` rendering in `UTC` so results do not vary with host local timezones.
- `[date.ts:buildMonthGrid]` — Aligns the grid to Sunday (`firstOfMonth.getUTCDay()`) with total length `Math.ceil((startOffset + daysInMonth) / 7) * 7` (always a multiple of 7; JSDoc notes 35- or 42-cell grids) and sets `inCurrentMonth` true only when both `cellYear === year` and `cellMonth === month`.

## Side Effects
- None

## Verification
- Run: `pnpm test`
