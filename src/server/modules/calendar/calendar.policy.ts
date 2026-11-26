import type { SeatSessionUser } from '@shared/types';
import type { PostSlotRow } from './calendar.table';

export interface CalendarPolicy {
  canViewManagedFields(user: SeatSessionUser | null): boolean;
  canBookForOrgUnit(user: SeatSessionUser | null, orgUnitId: string): boolean;
  canMutateSlot(
    user: SeatSessionUser | null,
    slot: Pick<PostSlotRow, 'ownerSeatCode'>,
  ): boolean;
  canBackfillPastDates(user: SeatSessionUser | null): boolean;
  canOverrideSlot(user: SeatSessionUser | null): boolean;
  requiresSuperAdminReason(user: SeatSessionUser | null): boolean;
}

export const defaultCalendarPolicy: CalendarPolicy = {
  canViewManagedFields(user) {
    return user !== null;
  },

  canBookForOrgUnit(user, orgUnitId) {
    if (!user) return false;
    if (user.capabilities.canBookAnyUnit) return true;
    return user.allowedOrgUnits.includes(orgUnitId);
  },

  canMutateSlot(user, slot) {
    if (!user) return false;
    if (user.capabilities.canMutateAnySlot) return true;
    return slot.ownerSeatCode === user.seatCode;
  },

  canBackfillPastDates(user) {
    return user !== null && user.capabilities.canBackfillPastDates;
  },

  canOverrideSlot(user) {
    return user !== null && user.capabilities.canMutateAnySlot;
  },

  requiresSuperAdminReason(user) {
    return user !== null && user.tier === 'super_admin';
  },
};
