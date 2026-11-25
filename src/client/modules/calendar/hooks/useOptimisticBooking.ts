import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CalendarMonthResponse,
  CreateSlotInput,
  RelocateSlotInput,
  UpdateSlotInput,
} from '@shared/types';
import { useToast } from '../../../app/providers';
import { useSession } from '../../../core/auth/useSession';
import {
  calendarKeys,
  cancelCalendarSlot,
  createCalendarSlot,
  relocateCalendarSlot,
  updateCalendarSlot,
} from '../api/calendar.queries';

export function useOptimisticBooking(month: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { pushToast } = useToast();
  const queryKey = calendarKeys.month(month);

  const bookMutation = useMutation({
    mutationFn: (input: CreateSlotInput) => createCalendarSlot(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CalendarMonthResponse>(queryKey);

      if (previous && user) {
        const now = new Date().toISOString();
        const optimisticSlot = {
          id: `optimistic-${input.postDate}`,
          postDate: input.postDate,
          title: input.title,
          entityCode: input.entityCode,
          format: input.format,
          status: 'booked' as const,
          creatorName: user.name,
          creatorId: user.id,
          notes: input.notes ?? null,
          relocationReason: null,
          version: 1,
          createdAt: now,
          updatedAt: now,
        };
        queryClient.setQueryData<CalendarMonthResponse>(queryKey, {
          ...previous,
          slots: [...previous.slots, optimisticSlot],
        });
      }

      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      pushToast(err instanceof Error ? err.message : 'Booking failed', 'error');
    },
    onSuccess: () => {
      pushToast('Post slot locked for the day', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSlotInput }) =>
      updateCalendarSlot(id, input),
    onError: (err) => {
      pushToast(err instanceof Error ? err.message : 'Update failed', 'error');
    },
    onSuccess: () => {
      pushToast('Slot updated', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const relocateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RelocateSlotInput }) =>
      relocateCalendarSlot(id, input),
    onError: (err) => {
      pushToast(err instanceof Error ? err.message : 'Relocation failed', 'error');
    },
    onSuccess: (slot) => {
      pushToast(
        slot.status === 'relocation_queue'
          ? 'Moved to Relocation Queue — date is now open'
          : `Rescheduled to ${slot.postDate}`,
        'success',
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'month'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelCalendarSlot(id),
    onError: (err) => {
      pushToast(err instanceof Error ? err.message : 'Cancellation failed', 'error');
    },
    onSuccess: () => {
      pushToast('Slot cancelled — date is now open', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    bookMutation,
    updateMutation,
    relocateMutation,
    cancelMutation,
  };
}
