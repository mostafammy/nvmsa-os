import { hasMinimumRole } from '@shared/constants';
import type { SessionUser } from '@shared/types';
import type { CalendarSlotRow } from './calendar.table';

export interface CalendarPolicy {
  canViewManagedFields(user: SessionUser | null): boolean;
  canBookSlot(user: SessionUser | null): boolean;
  canEditSlot(user: SessionUser | null, slot: Pick<CalendarSlotRow, 'creatorId'>): boolean;
  canRelocateSlot(user: SessionUser | null, slot: Pick<CalendarSlotRow, 'creatorId'>): boolean;
  canCancelSlot(user: SessionUser | null, slot: Pick<CalendarSlotRow, 'creatorId'>): boolean;
  canOverrideSlot(user: SessionUser | null): boolean;
}

export const defaultCalendarPolicy: CalendarPolicy = {
  canViewManagedFields(user) {
    return user !== null && hasMinimumRole(user.role, 'eb');
  },

  canBookSlot(user) {
    return user !== null && hasMinimumRole(user.role, 'eb');
  },

  canEditSlot(user, slot) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'eb' && slot.creatorId === user.id;
  },

  canRelocateSlot(user, slot) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'eb' && slot.creatorId === user.id;
  },

  canCancelSlot(user, slot) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'eb' && slot.creatorId === user.id;
  },

  canOverrideSlot(user) {
    return user !== null && user.role === 'admin';
  },
};
