import type {
  CalendarMonthResponse,
  CreateSlotInput,
  ManagedSlotView,
  RelocateSlotInput,
  UpdateSlotInput,
} from '@shared/types';
import { apiClient } from '../../../core/api/client';
import { readSwrCache, writeSwrCache } from '../../../core/storage/cache';

export const calendarKeys = {
  month: (yearMonth: string) => ['calendar', 'month', yearMonth] as const,
};

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchCalendarMonth(month: string): Promise<CalendarMonthResponse> {
  const res = await apiClient.api.calendar.slots.$get({ query: { month } });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to load calendar month'));
  }
  const data = (await res.json()) as CalendarMonthResponse;
  writeSwrCache(`calendar:${month}`, data);
  return data;
}

export function getCachedCalendarMonth(month: string): CalendarMonthResponse | undefined {
  return readSwrCache<CalendarMonthResponse>(`calendar:${month}`);
}

export async function createCalendarSlot(input: CreateSlotInput): Promise<ManagedSlotView> {
  const res = await apiClient.api.calendar.slots.$post({ json: input });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Could not book slot'));
  }
  const body = (await res.json()) as { slot: ManagedSlotView };
  return body.slot;
}

export async function updateCalendarSlot(
  id: string,
  input: UpdateSlotInput,
): Promise<ManagedSlotView> {
  const res = await apiClient.api.calendar.slots[':id'].$patch({
    param: { id },
    json: input,
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Could not update slot'));
  }
  const body = (await res.json()) as { slot: ManagedSlotView };
  return body.slot;
}

export async function relocateCalendarSlot(
  id: string,
  input: RelocateSlotInput,
): Promise<ManagedSlotView> {
  const res = await apiClient.api.calendar.slots[':id'].relocate.$post({
    param: { id },
    json: input,
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Could not relocate slot'));
  }
  const body = (await res.json()) as { slot: ManagedSlotView };
  return body.slot;
}

export async function cancelCalendarSlot(id: string): Promise<ManagedSlotView> {
  const res = await apiClient.api.calendar.slots[':id'].$delete({
    param: { id },
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Could not cancel slot'));
  }
  const body = (await res.json()) as { slot: ManagedSlotView };
  return body.slot;
}
