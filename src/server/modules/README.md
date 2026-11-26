# Modules (`src/server/modules`)

## Overview
Houses domain-specific backend feature modules mounted into the NVMSA OS Hono API application.

## Subdirectories & Boundaries
- Calendar: [./calendar/README.md](./calendar/README.md) - 1-post-per-day content calendar domain module exposing Drizzle tables (`calendarSlots`, `calendarSlotAuditLogs`), `CalendarPolicy`/`defaultCalendarPolicy`, `ISlotRepository` (`D1SlotRepository`, `InMemorySlotRepository`), `CalendarService`, and `calendarRoutes`.
