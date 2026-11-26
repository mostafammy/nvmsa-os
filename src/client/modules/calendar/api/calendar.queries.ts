import type {
  BookSlotInput,
  CancelSlotInput,
  MonthScheduleResponse,
  OverrideSlotInput,
  OverrideSlotResponse,
  QueueRelocationInput,
  RelocateSlotInput,
  RelocationQueueResponse,
  SlotAuditLogEntry,
  SlotMutationResponse,
  UpdateSlotInput,
} from '@shared/types';
import { apiClient, parseApiError } from '../../../core/api/client';
import { readSwrCacheWithMeta, writeSwrCache, type SwrCacheEnvelope } from '../../../core/storage/cache';

export const calendarKeys = {
  month: (scope: string, yearMonth: string) => ['calendar', 'month', scope, yearMonth] as const,
  relocations: (scope: string) => ['calendar', 'relocations', scope] as const,
  history: (slotId: string) => ['calendar', 'history', slotId] as const,
};

export async function fetchCalendarMonth(
  ym: string,
  scope: string,
): Promise<MonthScheduleResponse> {
  const res = await apiClient.api.v1.calendar.month.$get({ query: { ym } });
  if (!res.ok) {
    throw await parseApiError(res, 'Failed to load calendar month');
  }
  const data = (await res.json()) as MonthScheduleResponse;
  writeSwrCache(scope, `calendar:${ym}`, data);
  return data;
}

export function getCachedCalendarMonth(
  ym: string,
  scope: string,
): SwrCacheEnvelope<MonthScheduleResponse> | undefined {
  return readSwrCacheWithMeta<MonthScheduleResponse>(scope, `calendar:${ym}`);
}

export async function fetchRelocationQueue(): Promise<RelocationQueueResponse> {
  const res = await apiClient.api.v1.calendar.relocations.$get();
  if (!res.ok) {
    throw await parseApiError(res, 'Failed to load relocation queue');
  }
  return (await res.json()) as RelocationQueueResponse;
}

export async function fetchSlotHistory(slotId: string): Promise<SlotAuditLogEntry[]> {
  const res = await apiClient.api.v1.calendar.slots[':id'].history.$get({
    param: { id: slotId },
  });
  if (!res.ok) {
    throw await parseApiError(res, 'Failed to load slot audit history');
  }
  const body = (await res.json()) as { history: SlotAuditLogEntry[] };
  return body.history;
}

async function sendMutation<T>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  payload: unknown,
  idempotencyKey: string,
  fallbackError: string,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await parseApiError(res, fallbackError);
  }
  return (await res.json()) as T;
}

export function bookCalendarSlot(
  input: BookSlotInput,
  idempotencyKey: string,
): Promise<SlotMutationResponse> {
  return sendMutation<SlotMutationResponse>(
    '/api/v1/calendar/slots',
    'POST',
    input,
    idempotencyKey,
    'Could not book slot',
  );
}

export function updateCalendarSlot(
  id: string,
  input: UpdateSlotInput,
  idempotencyKey: string,
): Promise<SlotMutationResponse> {
  return sendMutation<SlotMutationResponse>(
    `/api/v1/calendar/slots/${encodeURIComponent(id)}`,
    'PATCH',
    input,
    idempotencyKey,
    'Could not update slot',
  );
}

export function queueCalendarRelocation(
  id: string,
  input: QueueRelocationInput,
  idempotencyKey: string,
): Promise<SlotMutationResponse> {
  return sendMutation<SlotMutationResponse>(
    `/api/v1/calendar/slots/${encodeURIComponent(id)}/queue-relocation`,
    'POST',
    input,
    idempotencyKey,
    'Could not move slot to relocation queue',
  );
}

export function relocateCalendarSlot(
  id: string,
  input: RelocateSlotInput,
  idempotencyKey: string,
): Promise<SlotMutationResponse> {
  return sendMutation<SlotMutationResponse>(
    `/api/v1/calendar/slots/${encodeURIComponent(id)}/relocate`,
    'POST',
    input,
    idempotencyKey,
    'Could not relocate slot',
  );
}

export function overrideCalendarSlot(
  input: OverrideSlotInput,
  idempotencyKey: string,
): Promise<OverrideSlotResponse> {
  return sendMutation<OverrideSlotResponse>(
    '/api/v1/calendar/slots/override',
    'POST',
    input,
    idempotencyKey,
    'Could not override slot',
  );
}

export function cancelCalendarSlot(
  id: string,
  input: CancelSlotInput,
  idempotencyKey: string,
): Promise<SlotMutationResponse> {
  return sendMutation<SlotMutationResponse>(
    `/api/v1/calendar/slots/${encodeURIComponent(id)}`,
    'DELETE',
    input,
    idempotencyKey,
    'Could not cancel slot',
  );
}
