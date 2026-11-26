import type {
  OfficeSeatView,
  OrgUnit,
  PatchOrgUnitInput,
  UpdateSeatInput,
  UpsertOrgUnitInput,
} from '@shared/types';
import { apiClient, createIdempotencyKey, parseApiError } from '../../../core/api/client';

export const adminKeys = {
  seats: ['admin', 'seats'] as const,
  orgUnits: ['admin', 'org-units'] as const,
};

export async function fetchAdminSeats(): Promise<OfficeSeatView[]> {
  const res = await apiClient.api.v1.admin.seats.$get();
  if (!res.ok) {
    throw await parseApiError(res, 'Failed to load official seats');
  }
  const body = (await res.json()) as { seats: OfficeSeatView[] };
  return body.seats;
}

export async function fetchAdminOrgUnits(): Promise<OrgUnit[]> {
  const res = await apiClient.api.v1.admin['org-units'].$get();
  if (!res.ok) {
    throw await parseApiError(res, 'Failed to load organization units');
  }
  const body = (await res.json()) as { orgUnits: OrgUnit[] };
  return body.orgUnits;
}

export async function updateAdminSeat(
  seatCode: string,
  input: UpdateSeatInput,
): Promise<OfficeSeatView> {
  const res = await fetch(`/api/v1/admin/seats/${encodeURIComponent(seatCode)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw await parseApiError(res, 'Could not update official seat');
  }
  const body = (await res.json()) as { seat: OfficeSeatView };
  return body.seat;
}

export async function createAdminOrgUnit(input: UpsertOrgUnitInput): Promise<OrgUnit> {
  const res = await fetch('/api/v1/admin/org-units', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw await parseApiError(res, 'Could not create organization unit');
  }
  const body = (await res.json()) as { orgUnit: OrgUnit };
  return body.orgUnit;
}

export async function updateAdminOrgUnit(
  id: string,
  input: PatchOrgUnitInput,
): Promise<OrgUnit> {
  const res = await fetch(`/api/v1/admin/org-units/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw await parseApiError(res, 'Could not update organization unit');
  }
  const body = (await res.json()) as { orgUnit: OrgUnit };
  return body.orgUnit;
}
