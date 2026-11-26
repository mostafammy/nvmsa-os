# Types

## Overview
Compile-time TypeScript type definitions inferred directly from the Zod schemas in `../schemas` so static types remain synchronized with runtime validation contracts.

## Interface
- `[index.ts:SessionUser]` — `z.infer<typeof SessionUserSchema>`
- `[index.ts:SignInInput]` — `z.infer<typeof SignInInputSchema>`
- `[index.ts:SignUpInput]` — `z.infer<typeof SignUpInputSchema>`
- `[index.ts:SlotStatus]` — `z.infer<typeof SlotStatusSchema>`
- `[index.ts:PostFormat]` — `z.infer<typeof PostFormatSchema>`
- `[index.ts:SlotAuditAction]` — `z.infer<typeof SlotAuditActionSchema>`
- `[index.ts:SlotAuditLogEntry]` — `z.infer<typeof SlotAuditLogEntrySchema>`
- `[index.ts:PublicSlotView]` — `z.infer<typeof PublicSlotViewSchema>`
- `[index.ts:ManagedSlotView]` — `z.infer<typeof ManagedSlotViewSchema>`
- `[index.ts:CreateSlotInput]` — `z.infer<typeof CreateSlotInputSchema>`
- `[index.ts:UpdateSlotInput]` — `z.infer<typeof UpdateSlotInputSchema>`
- `[index.ts:RelocateSlotInput]` — `z.infer<typeof RelocateSlotInputSchema>`
- `[index.ts:CalendarMonthResponse]` — `z.infer<typeof CalendarMonthResponseSchema>`

## Invariants
- `[index.ts:SessionUser]`–`[index.ts:CalendarMonthResponse]` — All imports use `import type` and every exported type is derived via `z.infer<typeof ...>` from `../schemas`, producing zero runtime code and preventing type/schema divergence.

## Side Effects
- None

## Verification
- Run: `pnpm test`
