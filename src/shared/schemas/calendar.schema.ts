import { z } from 'zod';
import { isValidIsoDate, isValidYearMonth } from '../utils/date';
import { OrgUnitSchema } from './auth.schema';

export const IsoDateSchema = z
  .string()
  .refine(isValidIsoDate, 'Date must be a valid YYYY-MM-DD calendar date');

export const YearMonthSchema = z
  .string()
  .refine(isValidYearMonth, 'Month must be a valid YYYY-MM between 2020-01 and 2100-12');

export const SlotStatusSchema = z.enum(['BOOKED', 'PENDING_RELOCATION', 'CANCELLED']);

export const ContentTypeSchema = z.enum(['POST', 'PHOTO', 'REEL', 'COLLAB', 'STORY_CAMPAIGN']);

export const SlotAuditActionSchema = z.enum([
  'BOOKED',
  'UPDATED',
  'QUEUED_RELOCATION',
  'RELOCATED',
  'CANCELLED',
  'ADMIN_OVERRIDE',
]);

export const AssetUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Asset link must be a valid https:// URL' },
  )
  .nullable()
  .optional();

/**
 * ISP Read DTO for unauthenticated visitors and general public schedule reads.
 * Intentionally omits internal notes, relocationReason, and raw super_admin identities.
 */
export const PublicSlotViewSchema = z.object({
  id: z.string(),
  postDate: IsoDateSchema.nullable(),
  status: SlotStatusSchema,
  orgUnitId: z.string(),
  contentType: ContentTypeSchema,
  title: z.string(),
  assetUrl: z.string().nullable(),
  ownerSeatCode: z.string(),
  creatorName: z.string(),
  version: z.number().int().positive(),
  updatedAt: z.string(),
});

/**
 * Extended DTO for signed-in seat holders.
 */
export const ManagedSlotViewSchema = PublicSlotViewSchema.extend({
  createdById: z.string().nullable(),
  notes: z.string().nullable(),
  relocationReason: z.string().nullable(),
  previousDate: IsoDateSchema.nullable(),
  createdAt: z.string(),
});

export const SlotAuditLogEntrySchema = z.object({
  id: z.string(),
  slotId: z.string(),
  action: SlotAuditActionSchema,
  actorId: z.string().nullable(),
  actorName: z.string(),
  actorRole: z.string(),
  diffJson: z.string(),
  requestId: z.string(),
  createdAt: z.string(),
});

/**
 * Write command: Book a new 1-post-per-Cairo-day slot.
 */
export const BookSlotInputSchema = z.object({
  postDate: IsoDateSchema,
  orgUnitId: z.string().trim().min(2).max(32),
  contentType: ContentTypeSchema.default('POST'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  notes: z.string().trim().max(500).nullable().optional(),
  assetUrl: AssetUrlSchema,
  reason: z.string().trim().max(280).optional(),
});

/**
 * Write command: Edit an existing slot (OCC expectedVersion required).
 */
export const UpdateSlotInputSchema = z
  .object({
    orgUnitId: z.string().trim().min(2).max(32).optional(),
    contentType: ContentTypeSchema.optional(),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120).optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    assetUrl: AssetUrlSchema,
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().max(280).optional(),
  })
  .refine(
    (data) =>
      data.orgUnitId !== undefined ||
      data.contentType !== undefined ||
      data.title !== undefined ||
      data.notes !== undefined ||
      data.assetUrl !== undefined,
    {
      message: 'At least one editable field must be provided',
    },
  );

/**
 * Write command: Move a booked slot into the Pending Relocation queue (frees post_date).
 */
export const QueueRelocationInputSchema = z.object({
  expectedVersion: z.number().int().positive(),
  relocationReason: z
    .string()
    .trim()
    .min(3, 'Please provide a short relocation reason')
    .max(280),
  reason: z.string().trim().max(280).optional(),
});

/**
 * Write command: Place a queued or booked slot onto an open Cairo date.
 */
export const RelocateSlotInputSchema = z.object({
  expectedVersion: z.number().int().positive(),
  targetDate: IsoDateSchema,
  reason: z.string().trim().max(280).optional(),
});

/**
 * Write command: Privileged override atomically displacing an existing booked occupant.
 */
export const OverrideSlotInputSchema = z.object({
  postDate: IsoDateSchema,
  orgUnitId: z.string().trim().min(2).max(32),
  contentType: ContentTypeSchema.default('POST'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  notes: z.string().trim().max(500).nullable().optional(),
  assetUrl: AssetUrlSchema,
  reason: z.string().trim().min(3, 'Override reason is required').max(280),
  expectedOccupantVersion: z.number().int().positive().optional(),
});

/**
 * Write command: Cancel a slot (OCC expectedVersion required).
 */
export const CancelSlotInputSchema = z.object({
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().max(280).optional(),
});

export const MonthScheduleResponseSchema = z.object({
  month: YearMonthSchema,
  gridStart: IsoDateSchema,
  gridEnd: IsoDateSchema,
  serverTodayCairo: IsoDateSchema,
  orgUnits: z.array(OrgUnitSchema),
  slots: z.array(PublicSlotViewSchema.or(ManagedSlotViewSchema)),
});

export const RelocationQueueResponseSchema = z.object({
  items: z.array(ManagedSlotViewSchema),
});

export const SlotMutationResponseSchema = z.object({
  slot: ManagedSlotViewSchema,
  affectedMonths: z.array(YearMonthSchema),
});

export const OverrideSlotResponseSchema = SlotMutationResponseSchema.extend({
  displacedSlot: ManagedSlotViewSchema.nullable(),
});

export const ConflictWinnerPayloadSchema = z.object({
  winner: PublicSlotViewSchema,
  nextOpenDate: IsoDateSchema.nullable(),
});
