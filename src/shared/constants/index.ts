export * from './palette';
export * from './roles';
export * from './committees';
export * from './divisions';

import { STANDING_COMMITTEES, type CanonicalUnitMetadata } from './committees';
import { SUPPORT_DIVISIONS } from './divisions';

/**
 * Fallback/seed catalog matching the 11 canonical org_units in D1.
 * Authoritative runtime lists always come from D1 `org_units`.
 */
export const CANONICAL_ORG_UNITS: readonly CanonicalUnitMetadata[] = [
  ...STANDING_COMMITTEES,
  ...SUPPORT_DIVISIONS,
];

export const CANONICAL_ORG_UNIT_CODES = CANONICAL_ORG_UNITS.map((unit) => unit.code) as [
  string,
  ...string[],
];

export const CANONICAL_ORG_UNIT_MAP: Record<string, CanonicalUnitMetadata> = Object.fromEntries(
  CANONICAL_ORG_UNITS.map((unit) => [unit.code, unit]),
);
