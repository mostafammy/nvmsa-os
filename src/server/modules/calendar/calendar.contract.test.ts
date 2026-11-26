import { describe, expect, it } from 'vitest';
import { CANONICAL_ORG_UNITS } from '@shared/constants';
import type { OrgUnit } from '@shared/types';
import {
  ConflictError,
  PreconditionFailedError,
} from '../../core/errors/domain-errors';
import { InMemorySlotRepository } from './calendar.repository';

const SEED_UNITS: OrgUnit[] = CANONICAL_ORG_UNITS.map((u) => ({
  id: u.code,
  code: u.code,
  name: u.name,
  kind: u.kind,
  accentToken: u.accentToken,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

describe('ISlotRepository Atomic Contract', () => {
  it('commits zero audit or idempotency rows when bookSlotAtomic hits uq_active_post_date collision', async () => {
    const repo = new InMemorySlotRepository(SEED_UNITS);
    const nowIso = '2026-11-26T10:00:00.000Z';

    await repo.bookSlotAtomic({
      slot: {
        id: 'slot-1',
        postDate: '2026-12-20',
        status: 'BOOKED',
        orgUnitId: 'SCOPH',
        contentType: 'POST',
        title: 'Winner Slot',
        ownerSeatCode: 'LPO',
        createdById: 'u-1',
        createdByName: 'LPO',
        version: 1,
        lastMutationId: 'mut-1',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      audit: {
        id: 'aud-1',
        slotId: 'slot-1',
        actorId: 'u-1',
        actorName: 'LPO',
        actorRole: 'officer_sc',
        action: 'BOOKED',
        diffJson: '{}',
        requestId: 'req-1',
        createdAt: nowIso,
      },
    });

    await expect(
      repo.bookSlotAtomic({
        slot: {
          id: 'slot-2',
          postDate: '2026-12-20',
          status: 'BOOKED',
          orgUnitId: 'SCORE',
          contentType: 'POST',
          title: 'Loser Slot',
          ownerSeatCode: 'LEO & LORE',
          createdById: 'u-2',
          createdByName: 'LEO',
          version: 1,
          lastMutationId: 'mut-2',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        audit: {
          id: 'aud-2',
          slotId: 'slot-2',
          actorId: 'u-2',
          actorName: 'LEO',
          actorRole: 'officer_sc',
          action: 'BOOKED',
          diffJson: '{}',
          requestId: 'req-2',
          createdAt: nowIso,
        },
        idempotency: {
          key: 'idem-loser',
          userId: 'u-2',
          route: 'POST /slots',
          requestHash: 'abc',
          responseCode: 201,
          responseBody: '{}',
          createdAt: nowIso,
          expiresAt: '2026-11-27T10:00:00.000Z',
        },
      }),
    ).rejects.toThrow(ConflictError);

    expect(await repo.findById('slot-2')).toBeNull();
    expect(await repo.listAuditLogs('slot-2')).toHaveLength(0);
    expect(
      await repo.findIdempotencyRecord('idem-loser', 'u-2', 'POST /slots', nowIso),
    ).toBeNull();
  });

  it('throws 412 PreconditionFailedError with latest snapshot and zero phantom audit/idemp rows on stale OCC', async () => {
    const repo = new InMemorySlotRepository(SEED_UNITS);
    const t0 = '2026-11-26T10:00:00.000Z';

    await repo.bookSlotAtomic({
      slot: {
        id: 'slot-occ',
        postDate: '2026-12-22',
        status: 'BOOKED',
        orgUnitId: 'SCOPH',
        contentType: 'POST',
        title: 'Initial',
        ownerSeatCode: 'LPO',
        createdById: 'u-1',
        createdByName: 'LPO',
        version: 1,
        lastMutationId: 'mut-1',
        createdAt: t0,
        updatedAt: t0,
      },
      audit: {
        id: 'aud-occ-1',
        slotId: 'slot-occ',
        actorId: 'u-1',
        actorName: 'LPO',
        actorRole: 'officer_sc',
        action: 'BOOKED',
        diffJson: '{}',
        requestId: 'req-1',
        createdAt: t0,
      },
    });

    await repo.updateSlotAtomic({
      id: 'slot-occ',
      expectedVersion: 1,
      nextMutationId: 'mut-2',
      patch: {
        orgUnitId: 'SCOPH',
        contentType: 'REEL',
        title: 'Fresh V2',
        notes: null,
        assetUrl: null,
      },
      nowIso: '2026-11-26T10:05:00.000Z',
      audit: {
        id: 'aud-occ-2',
        actorId: 'u-1',
        actorName: 'LPO',
        actorRole: 'officer_sc',
        action: 'UPDATED',
        diffJson: '{}',
        requestId: 'req-2',
        createdAt: '2026-11-26T10:05:00.000Z',
      },
    });

    try {
      await repo.cancelSlotAtomic({
        id: 'slot-occ',
        expectedVersion: 1,
        nextMutationId: 'mut-stale',
        nowIso: '2026-11-26T10:06:00.000Z',
        audit: {
          id: 'aud-occ-stale',
          actorId: 'u-1',
          actorName: 'LPO',
          actorRole: 'officer_sc',
          action: 'CANCELLED',
          diffJson: '{}',
          requestId: 'req-3',
          createdAt: '2026-11-26T10:06:00.000Z',
        },
        idempotency: {
          key: 'idem-stale',
          userId: 'u-1',
          route: 'DELETE /slots/slot-occ',
          requestHash: 'xyz',
          responseCode: 200,
          responseBody: '{}',
          createdAt: '2026-11-26T10:06:00.000Z',
          expiresAt: '2026-11-27T10:06:00.000Z',
        },
      });
      expect.unreachable('Expected PreconditionFailedError');
    } catch (error) {
      expect(error).toBeInstanceOf(PreconditionFailedError);
      const err = error as PreconditionFailedError;
      expect((err.details as { latest: { version: number } }).latest.version).toBe(2);
    }

    expect(await repo.listAuditLogs('slot-occ')).toHaveLength(2);
    expect(
      await repo.findIdempotencyRecord(
        'idem-stale',
        'u-1',
        'DELETE /slots/slot-occ',
        '2026-11-26T10:06:00.000Z',
      ),
    ).toBeNull();
  });

  it('prunes expired idempotency records without affecting active keys', async () => {
    const repo = new InMemorySlotRepository(SEED_UNITS);
    await repo.bookSlotAtomic({
      slot: {
        id: 'slot-idem',
        postDate: '2026-12-25',
        status: 'BOOKED',
        orgUnitId: 'EB',
        contentType: 'POST',
        title: 'Idem Test',
        ownerSeatCode: 'PRES',
        createdById: 'u-pres',
        createdByName: 'PRES',
        version: 1,
        lastMutationId: 'mut-idem',
        createdAt: '2026-11-25T10:00:00.000Z',
        updatedAt: '2026-11-25T10:00:00.000Z',
      },
      audit: {
        id: 'aud-idem',
        slotId: 'slot-idem',
        actorId: 'u-pres',
        actorName: 'PRES',
        actorRole: 'eb_president',
        action: 'BOOKED',
        diffJson: '{}',
        requestId: 'req-idem',
        createdAt: '2026-11-25T10:00:00.000Z',
      },
      idempotency: {
        key: 'old-key',
        userId: 'u-pres',
        route: 'POST /slots',
        requestHash: 'hash-1',
        responseCode: 201,
        responseBody: '{}',
        createdAt: '2026-11-24T10:00:00.000Z',
        expiresAt: '2026-11-25T10:00:00.000Z',
      },
    });

    await repo.pruneExpiredIdempotencyKeys('2026-11-26T10:00:00.000Z', 20);
    expect(
      await repo.findIdempotencyRecord('old-key', 'u-pres', 'POST /slots', '2026-11-25T09:00:00.000Z'),
    ).toBeNull();
  });
});
