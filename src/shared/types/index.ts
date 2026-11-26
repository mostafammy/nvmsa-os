import type { z } from 'zod';
import type {
  AccentTokenSchema,
  BookSlotInputSchema,
  CancelSlotInputSchema,
  ConflictWinnerPayloadSchema,
  ContentTypeSchema,
  ManagedSlotViewSchema,
  MonthScheduleResponseSchema,
  OfficeSeatViewSchema,
  OrgUnitKindSchema,
  OrgUnitSchema,
  OverrideSlotInputSchema,
  OverrideSlotResponseSchema,
  PatchOrgUnitInputSchema,
  PublicSlotViewSchema,
  QueueRelocationInputSchema,
  RelocateSlotInputSchema,
  RelocationQueueResponseSchema,
  SeatCapabilitiesSchema,
  SeatSessionUserSchema,
  SlotAuditActionSchema,
  SlotAuditLogEntrySchema,
  SlotMutationResponseSchema,
  SlotStatusSchema,
  UpdateSeatInputSchema,
  UpdateSlotInputSchema,
  UpsertOrgUnitInputSchema,
} from '../schemas';

export type OrgUnitKind = z.infer<typeof OrgUnitKindSchema>;
export type AccentTokenType = z.infer<typeof AccentTokenSchema>;
export type SeatCapabilitiesDto = z.infer<typeof SeatCapabilitiesSchema>;
export type OrgUnit = z.infer<typeof OrgUnitSchema>;
export type OfficeSeatView = z.infer<typeof OfficeSeatViewSchema>;
export type UpdateSeatInput = z.infer<typeof UpdateSeatInputSchema>;
export type UpsertOrgUnitInput = z.infer<typeof UpsertOrgUnitInputSchema>;
export type PatchOrgUnitInput = z.infer<typeof PatchOrgUnitInputSchema>;
export type SeatSessionUser = z.infer<typeof SeatSessionUserSchema>;

export type SlotStatus = z.infer<typeof SlotStatusSchema>;
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type SlotAuditAction = z.infer<typeof SlotAuditActionSchema>;
export type SlotAuditLogEntry = z.infer<typeof SlotAuditLogEntrySchema>;
export type PublicSlotView = z.infer<typeof PublicSlotViewSchema>;
export type ManagedSlotView = z.infer<typeof ManagedSlotViewSchema>;

export type BookSlotInput = z.infer<typeof BookSlotInputSchema>;
export type UpdateSlotInput = z.infer<typeof UpdateSlotInputSchema>;
export type QueueRelocationInput = z.infer<typeof QueueRelocationInputSchema>;
export type RelocateSlotInput = z.infer<typeof RelocateSlotInputSchema>;
export type OverrideSlotInput = z.infer<typeof OverrideSlotInputSchema>;
export type CancelSlotInput = z.infer<typeof CancelSlotInputSchema>;

export type MonthScheduleResponse = z.infer<typeof MonthScheduleResponseSchema>;
export type RelocationQueueResponse = z.infer<typeof RelocationQueueResponseSchema>;
export type SlotMutationResponse = z.infer<typeof SlotMutationResponseSchema>;
export type OverrideSlotResponse = z.infer<typeof OverrideSlotResponseSchema>;
export type ConflictWinnerPayload = z.infer<typeof ConflictWinnerPayloadSchema>;
