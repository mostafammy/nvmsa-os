import { z } from 'zod';
import { ACCENT_TOKENS, SEAT_BRANCHES, SEAT_TIERS, VISIBLE_SEAT_TIERS } from '../constants';

export const SeatTierSchema = z.enum(SEAT_TIERS);
export const VisibleSeatTierSchema = z.enum(VISIBLE_SEAT_TIERS);
export const SeatBranchSchema = z.enum(SEAT_BRANCHES);
export const OrgUnitKindSchema = z.enum(['COMMITTEE', 'DIVISION', 'BOARD']);
export const AccentTokenSchema = z.enum(ACCENT_TOKENS);

export const SeatCapabilitiesSchema = z.object({
  canBookAnyUnit: z.boolean(),
  canMutateAnySlot: z.boolean(),
  canBackfillPastDates: z.boolean(),
  canManageSeats: z.boolean(),
  canManageOrgUnits: z.boolean(),
  canSeeSuperAdmin: z.boolean(),
});

export const OrgUnitSchema = z.object({
  id: z.string().min(1).max(32),
  code: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[A-Z0-9_-]+$/, 'Org unit code must use uppercase letters, numbers, _ or -'),
  name: z.string().trim().min(2).max(120),
  kind: OrgUnitKindSchema,
  accentToken: AccentTokenSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OfficeSeatViewSchema = z.object({
  seatCode: z.string().min(1),
  branch: SeatBranchSchema,
  title: z.string().min(1),
  tier: VisibleSeatTierSchema,
  assignedEmail: z.string().email(),
  isActive: z.boolean(),
  allowedOrgUnits: z.array(z.string().min(1)),
  updatedAt: z.string(),
});

export const UpdateSeatInputSchema = z
  .object({
    assignedEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email('Must be a valid email address')
      .optional(),
    isActive: z.boolean().optional(),
    reason: z.string().trim().max(280).optional(),
  })
  .refine((data) => data.assignedEmail !== undefined || data.isActive !== undefined, {
    message: 'Provide assignedEmail or isActive to update a seat',
  });

export const UpsertOrgUnitInputSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(24)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric with _ or -'),
  name: z.string().trim().min(2).max(120),
  kind: OrgUnitKindSchema,
  accentToken: AccentTokenSchema,
  isActive: z.boolean().default(true),
  reason: z.string().trim().max(280).optional(),
});

export const PatchOrgUnitInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    kind: OrgUnitKindSchema.optional(),
    accentToken: AccentTokenSchema.optional(),
    isActive: z.boolean().optional(),
    reason: z.string().trim().max(280).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.kind !== undefined ||
      data.accentToken !== undefined ||
      data.isActive !== undefined,
    {
      message: 'At least one field must be provided to update an org unit',
    },
  );

export const SeatSessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  seatCode: z.string().min(1),
  seatTitle: z.string().min(1),
  tier: SeatTierSchema,
  allowedOrgUnits: z.array(z.string().min(1)),
  defaultOrgUnitId: z.string().min(1),
  capabilities: SeatCapabilitiesSchema,
});
