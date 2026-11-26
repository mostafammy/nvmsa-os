import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BookSlotInput,
  CancelSlotInput,
  OverrideSlotInput,
  QueueRelocationInput,
  RelocateSlotInput,
  UpdateSlotInput,
} from '@shared/types';
import { useToast } from '../../../app/providers';
import { ApiRequestError } from '../../../core/api/client';
import { useSession } from '../../../core/auth/useSession';
import {
  bookCalendarSlot,
  calendarKeys,
  cancelCalendarSlot,
  overrideCalendarSlot,
  queueCalendarRelocation,
  relocateCalendarSlot,
  updateCalendarSlot,
} from '../api/calendar.queries';
import { CALENDAR_BROADCAST_CHANNEL } from './useCalendarMonth';

function broadcastAffectedMonths(months: string[]): void {
  if (typeof BroadcastChannel === 'undefined' || months.length === 0) return;
  const channel = new BroadcastChannel(CALENDAR_BROADCAST_CHANNEL);
  channel.postMessage({ type: 'invalidate', months });
  channel.close();
}

export function useOptimisticBooking(cacheScope: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { pushToast } = useToast();

  const invalidateMonths = (affectedMonths: string[], slotId?: string) => {
    for (const m of affectedMonths) {
      void queryClient.invalidateQueries({ queryKey: calendarKeys.month(cacheScope, m) });
    }
    void queryClient.invalidateQueries({ queryKey: calendarKeys.relocations(cacheScope) });
    if (slotId) {
      void queryClient.invalidateQueries({ queryKey: calendarKeys.history(slotId) });
    }
    broadcastAffectedMonths(affectedMonths);
  };

  const handleMutationError = (err: unknown, fallback: string) => {
    if (err instanceof ApiRequestError && (err.status === 409 || err.status === 412)) {
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'month', cacheScope] });
    }
    pushToast(err instanceof Error ? err.message : fallback, 'error');
  };

  const bookMutation = useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: BookSlotInput; idempotencyKey: string }) =>
      bookCalendarSlot(input, idempotencyKey),
    onSuccess: (res) => {
      pushToast(`Locked ${res.slot.orgUnitId} slot for ${res.slot.postDate}`, 'success');
      invalidateMonths(res.affectedMonths, res.slot.id);
    },
    onError: (err) => handleMutationError(err, 'Booking failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
      idempotencyKey,
    }: {
      id: string;
      input: UpdateSlotInput;
      idempotencyKey: string;
    }) => updateCalendarSlot(id, input, idempotencyKey),
    onSuccess: (res) => {
      pushToast('Slot changes saved', 'success');
      invalidateMonths(res.affectedMonths, res.slot.id);
    },
    onError: (err) => handleMutationError(err, 'Update failed'),
  });

  const queueRelocationMutation = useMutation({
    mutationFn: ({
      id,
      input,
      idempotencyKey,
    }: {
      id: string;
      input: QueueRelocationInput;
      idempotencyKey: string;
    }) => queueCalendarRelocation(id, input, idempotencyKey),
    onSuccess: (res) => {
      pushToast('Moved to Relocation Queue — date is now open', 'success');
      invalidateMonths(res.affectedMonths, res.slot.id);
    },
    onError: (err) => handleMutationError(err, 'Could not queue relocation'),
  });

  const relocateMutation = useMutation({
    mutationFn: ({
      id,
      input,
      idempotencyKey,
    }: {
      id: string;
      input: RelocateSlotInput;
      idempotencyKey: string;
    }) => relocateCalendarSlot(id, input, idempotencyKey),
    onSuccess: (res) => {
      pushToast(`Relocated post to ${res.slot.postDate}`, 'success');
      invalidateMonths(res.affectedMonths, res.slot.id);
    },
    onError: (err) => handleMutationError(err, 'Relocation failed'),
  });

  const overrideMutation = useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: OverrideSlotInput;
      idempotencyKey: string;
    }) => overrideCalendarSlot(input, idempotencyKey),
    onSuccess: (res) => {
      pushToast(
        res.displacedSlot
          ? `Assigned ${res.slot.postDate} — displaced post moved to Relocation Queue`
          : `Assigned ${res.slot.postDate}`,
        'success',
      );
      invalidateMonths(res.affectedMonths, res.slot.id);
    },
    onError: (err) => handleMutationError(err, 'Override failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      id,
      input,
      idempotencyKey,
    }: {
      id: string;
      input: CancelSlotInput;
      idempotencyKey: string;
    }) => cancelCalendarSlot(id, input, idempotencyKey),
    onSuccess: (res) => {
      pushToast('Slot cancelled — date is now open', 'success');
      invalidateMonths(res.affectedMonths, res.slot.id);
    },
    onError: (err) => handleMutationError(err, 'Cancellation failed'),
  });

  return {
    isAuthenticated: Boolean(user),
    bookMutation,
    updateMutation,
    queueRelocationMutation,
    relocateMutation,
    overrideMutation,
    cancelMutation,
  };
}
