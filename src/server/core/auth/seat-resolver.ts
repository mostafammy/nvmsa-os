import { and, eq, sql } from 'drizzle-orm';
import {
  getCapabilitiesForTier,
  SUPER_ADMIN_SEAT_CODE,
} from '@shared/constants';
import type { SeatSessionUser } from '@shared/types';
import type { Env } from '../config/env';
import type { AppDatabase } from '../db/client';
import { officeSeats, seatAllowedUnits } from '../db/schema';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resolveSuperAdminEmail(env: Env): string | null {
  const raw = env.SUPER_ADMIN_EMAIL?.trim();
  return raw ? raw.toLowerCase() : null;
}

export async function isEmailAllowlistedForSeat(
  db: AppDatabase,
  env: Env,
  rawEmail: string,
): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return false;
  }

  const superAdminEmail = resolveSuperAdminEmail(env);
  if (superAdminEmail && email === superAdminEmail) {
    return true;
  }

  const [seat] = await db
    .select({ seatCode: officeSeats.seatCode })
    .from(officeSeats)
    .where(and(sql`lower(${officeSeats.assignedEmail}) = ${email}`, eq(officeSeats.isActive, true)))
    .limit(1);

  return seat !== undefined;
}

export async function resolveSeatUser(
  db: AppDatabase,
  env: Env,
  identity: { id: string; name: string; email: string },
): Promise<SeatSessionUser | null> {
  const email = normalizeEmail(identity.email);
  if (!email) {
    return null;
  }

  const superAdminEmail = resolveSuperAdminEmail(env);
  if (superAdminEmail && email === superAdminEmail) {
    return {
      id: identity.id,
      name: identity.name,
      email,
      seatCode: SUPER_ADMIN_SEAT_CODE,
      seatTitle: 'System Administrator',
      tier: 'super_admin',
      allowedOrgUnits: [],
      defaultOrgUnitId: 'EB',
      capabilities: getCapabilitiesForTier('super_admin'),
    };
  }

  const [seat] = await db
    .select()
    .from(officeSeats)
    .where(and(sql`lower(${officeSeats.assignedEmail}) = ${email}`, eq(officeSeats.isActive, true)))
    .limit(1);

  if (!seat) {
    return null;
  }

  const unitRows = await db
    .select({ orgUnitId: seatAllowedUnits.orgUnitId })
    .from(seatAllowedUnits)
    .where(eq(seatAllowedUnits.seatCode, seat.seatCode));

  const allowedOrgUnits = unitRows.map((row) => row.orgUnitId);
  const defaultOrgUnitId = allowedOrgUnits[0] ?? 'EB';

  return {
    id: identity.id,
    name: identity.name,
    email,
    seatCode: seat.seatCode,
    seatTitle: seat.title,
    tier: seat.tier,
    allowedOrgUnits,
    defaultOrgUnitId,
    capabilities: getCapabilitiesForTier(seat.tier),
  };
}
