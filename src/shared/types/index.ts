import type { z } from 'zod';
import type {
  CalendarMonthResponseSchema,
  CreateSlotInputSchema,
  ManagedSlotViewSchema,
  PostFormatSchema,
  PublicSlotViewSchema,
  RelocateSlotInputSchema,
  SessionUserSchema,
  SignInInputSchema,
  SignUpInputSchema,
  SlotAuditActionSchema,
  SlotAuditLogEntrySchema,
  SlotStatusSchema,
  UpdateSlotInputSchema,
} from '../schemas';

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type SignInInput = z.infer<typeof SignInInputSchema>;
export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export type SlotStatus = z.infer<typeof SlotStatusSchema>;
export type PostFormat = z.infer<typeof PostFormatSchema>;
export type SlotAuditAction = z.infer<typeof SlotAuditActionSchema>;
export type SlotAuditLogEntry = z.infer<typeof SlotAuditLogEntrySchema>;
export type PublicSlotView = z.infer<typeof PublicSlotViewSchema>;
export type ManagedSlotView = z.infer<typeof ManagedSlotViewSchema>;
export type CreateSlotInput = z.infer<typeof CreateSlotInputSchema>;
export type UpdateSlotInput = z.infer<typeof UpdateSlotInputSchema>;
export type RelocateSlotInput = z.infer<typeof RelocateSlotInputSchema>;
export type CalendarMonthResponse = z.infer<typeof CalendarMonthResponseSchema>;
