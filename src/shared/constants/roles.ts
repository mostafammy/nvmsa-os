export const SEAT_TIERS = [
  'super_admin',
  'eb_president',
  'eb',
  'officer_sd_ops',
  'officer_sc',
  'officer_sd',
] as const;

export type SeatTier = (typeof SEAT_TIERS)[number];

export const VISIBLE_SEAT_TIERS = [
  'eb_president',
  'eb',
  'officer_sd_ops',
  'officer_sc',
  'officer_sd',
] as const;

export type VisibleSeatTier = (typeof VISIBLE_SEAT_TIERS)[number];

export const SEAT_BRANCHES = [
  'EXECUTIVE_BOARD',
  'STANDING_COMMITTEE',
  'SUPPORT_DIVISION',
] as const;

export type SeatBranch = (typeof SEAT_BRANCHES)[number];

export interface SeatCapabilities {
  canBookAnyUnit: boolean;
  canMutateAnySlot: boolean;
  canBackfillPastDates: boolean;
  canManageSeats: boolean;
  canManageOrgUnits: boolean;
  canSeeSuperAdmin: boolean;
}

const CAPABILITY_BY_TIER: Record<SeatTier, SeatCapabilities> = {
  super_admin: {
    canBookAnyUnit: true,
    canMutateAnySlot: true,
    canBackfillPastDates: true,
    canManageSeats: true,
    canManageOrgUnits: true,
    canSeeSuperAdmin: true,
  },
  eb_president: {
    canBookAnyUnit: true,
    canMutateAnySlot: true,
    canBackfillPastDates: true,
    canManageSeats: true,
    canManageOrgUnits: true,
    canSeeSuperAdmin: false,
  },
  eb: {
    canBookAnyUnit: true,
    canMutateAnySlot: true,
    canBackfillPastDates: true,
    canManageSeats: false,
    canManageOrgUnits: false,
    canSeeSuperAdmin: false,
  },
  officer_sd_ops: {
    canBookAnyUnit: true,
    canMutateAnySlot: true,
    canBackfillPastDates: true,
    canManageSeats: false,
    canManageOrgUnits: false,
    canSeeSuperAdmin: false,
  },
  officer_sc: {
    canBookAnyUnit: false,
    canMutateAnySlot: false,
    canBackfillPastDates: false,
    canManageSeats: false,
    canManageOrgUnits: false,
    canSeeSuperAdmin: false,
  },
  officer_sd: {
    canBookAnyUnit: false,
    canMutateAnySlot: false,
    canBackfillPastDates: false,
    canManageSeats: false,
    canManageOrgUnits: false,
    canSeeSuperAdmin: false,
  },
};

export function getCapabilitiesForTier(tier: SeatTier): SeatCapabilities {
  return CAPABILITY_BY_TIER[tier];
}

export const SUPER_ADMIN_SEAT_CODE = 'SUPER_ADMIN';
export const MASKED_SUPER_ADMIN_LABEL = 'Platform Maintenance';
export const MASKED_SUPER_ADMIN_ROLE = 'system';

export const TIER_LABELS: Record<SeatTier, string> = {
  super_admin: MASKED_SUPER_ADMIN_LABEL,
  eb_president: 'President',
  eb: 'Executive Board',
  officer_sd_ops: 'Calendar Ops Lead (PNSDD)',
  officer_sc: 'Standing Committee Officer',
  officer_sd: 'Support Division Director',
};
