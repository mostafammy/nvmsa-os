import { z } from 'zod';
import { NVMSA_ENTITY_CODES } from '../constants';

export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format');

export const YearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Month must use YYYY-MM format');

export const SlotStatusSchema = z.enum(['booked', 'relocation_queue', 'cancelled']);

export const PostFormatSchema = z.enum([
  'poster',
  'carousel',
  'reel',
  'story',
  'announcement',
]);

export const NvmsaEntityCodeSchema = z.enum(NVMSA_ENTITY_CODES);

/**
 * ISP Read DTO for Officers (public read-only calendar view).
 */
export const PublicSlotViewSchema = z.object({
  id: z.string(),
  postDate: IsoDateSchema,
  title: z.string(),
  entityCode: NvmsaEntityCodeSchema,
  format: PostFormatSchema,
  status: SlotStatusSchema,
  creatorName: z.string(),
});

/**
 * Extended DTO for authenticated EB Members & Admins.
 */
export const ManagedSlotViewSchema = PublicSlotViewSchema.extend({
  creatorId: z.string(),
  notes: z.string().nullable(),
  relocationReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Write command: Book a new 1-post-per-day slot.
 */
export const CreateSlotInputSchema = z.object({
  postDate: IsoDateSchema,
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  entityCode: NvmsaEntityCodeSchema,
  format: PostFormatSchema.default('poster'),
  notes: z.string().trim().max(500).nullable().optional(),
});

/**
 * Write command: Edit an existing slot (creator-only or admin).
 */
export const UpdateSlotInputSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    entityCode: NvmsaEntityCodeSchema.optional(),
    format: PostFormatSchema.optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

/**
 * Write command: Queue a slot for relocation or reschedule it onto an open date.
 */
export const RelocateSlotInputSchema = z.object({
  targetDate: IsoDateSchema.nullable().optional(),
  reason: z.string().trim().min(3, 'Please provide a short relocation reason').max(280),
});

export const CalendarMonthResponseSchema = z.object({
  month: YearMonthSchema,
  slots: z.array(PublicSlotViewSchema.or(ManagedSlotViewSchema)),
  relocationQueue: z.array(ManagedSlotViewSchema),
});
