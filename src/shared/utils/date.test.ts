import { describe, expect, it } from 'vitest';
import { ACCENT_PALETTE, ACCENT_TOKENS } from '../constants/palette';
import { getCapabilitiesForTier, SEAT_TIERS } from '../constants/roles';
import { YearMonthSchema } from '../schemas/calendar.schema';
import {
  addDaysIsoDate,
  buildMonthGrid,
  FIXED_CALENDAR_GRID_CELLS,
  getGridDateBounds,
  getTodayCairoDate,
  isPastCairoDate,
  isValidIsoDate,
  isValidYearMonth,
  shiftYearMonth,
} from './date';

describe('Calendar Date & Shared Invariants', () => {
  it('always builds a fixed 42-cell grid regardless of month length or start weekday', () => {
    const sampleMonths = ['2026-02', '2024-02', '2026-08', '2026-11', '2025-03'];
    for (const ym of sampleMonths) {
      const cells = buildMonthGrid(ym);
      expect(cells).toHaveLength(FIXED_CALENDAR_GRID_CELLS);
      const { gridStart, gridEnd } = getGridDateBounds(ym);
      expect(cells[0]?.isoDate).toBe(gridStart);
      expect(cells[41]?.isoDate).toBe(gridEnd);
    }
  });

  it('rejects out-of-range months and invalid calendar dates cleanly', () => {
    expect(isValidYearMonth('2026-00')).toBe(false);
    expect(isValidYearMonth('2026-13')).toBe(false);
    expect(isValidYearMonth('2019-12')).toBe(false);
    expect(isValidYearMonth('2026-11')).toBe(true);

    expect(YearMonthSchema.safeParse('2026-00').success).toBe(false);
    expect(YearMonthSchema.safeParse('2026-13').success).toBe(false);
    expect(YearMonthSchema.safeParse('2026-02').success).toBe(true);

    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2026-11-31')).toBe(false);
  });

  it('evaluates Africa/Cairo dates accurately across UTC midnight boundaries', () => {
    // 22:30 UTC in winter (EET UTC+2) is already next day 00:30 in Cairo
    const instant = new Date('2026-11-26T22:30:00.000Z');
    expect(getTodayCairoDate(instant)).toBe('2026-11-27');
    expect(isPastCairoDate('2026-11-26', '2026-11-27')).toBe(true);
    expect(isPastCairoDate('2026-11-27', '2026-11-27')).toBe(false);
    expect(addDaysIsoDate('2026-11-30', 1)).toBe('2026-12-01');
    expect(shiftYearMonth('2026-12', 1)).toBe('2027-01');
  });

  it('exposes complete closed 12-token ACCENT_PALETTE and all seat tier capabilities', () => {
    expect(ACCENT_TOKENS).toHaveLength(12);
    for (const token of ACCENT_TOKENS) {
      const entry = ACCENT_PALETTE[token];
      expect(entry.cellSurface).toBeTruthy();
      expect(entry.badgeClass).toBeTruthy();
    }
    for (const tier of SEAT_TIERS) {
      const caps = getCapabilitiesForTier(tier);
      expect(typeof caps.canBookAnyUnit).toBe('boolean');
      expect(typeof caps.canSeeSuperAdmin).toBe('boolean');
    }
    expect(getCapabilitiesForTier('super_admin').canSeeSuperAdmin).toBe(true);
    expect(getCapabilitiesForTier('eb_president').canSeeSuperAdmin).toBe(false);
    expect(getCapabilitiesForTier('eb_president').canManageSeats).toBe(true);
    expect(getCapabilitiesForTier('officer_sd_ops').canBookAnyUnit).toBe(true);
    expect(getCapabilitiesForTier('officer_sc').canBookAnyUnit).toBe(false);
  });
});
