import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ORG_UNITS,
  getCapabilitiesForTier,
  MASKED_SUPER_ADMIN_LABEL,
  MASKED_SUPER_ADMIN_ROLE,
} from '@shared/constants';
import type { OrgUnit, SeatSessionUser } from '@shared/types';
import {
  ConflictError,
  ForbiddenError,
  PreconditionFailedError,
  UnprocessableEntityError,
  ValidationError,
} from '../../core/errors/domain-errors';
import { defaultCalendarPolicy } from './calendar.policy';
import { InMemorySlotRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';

const SEED_ORG_UNITS: OrgUnit[] = CANONICAL_ORG_UNITS.map((unit) => ({
  id: unit.code,
  code: unit.code,
  name: unit.name,
  kind: unit.kind,
  accentToken: unit.accentToken,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

const lpoSeatUser: SeatSessionUser = {
  id: 'u-lpo-1',
  name: 'Nour LPO',
  email: 'lpoo.nvmsa@gmail.com',
  seatCode: 'LPO',
  seatTitle: 'Local Public Health Officer',
  tier: 'officer_sc',
  allowedOrgUnits: ['SCOPH'],
  defaultOrgUnitId: 'SCOPH',
  capabilities: getCapabilitiesForTier('officer_sc'),
};

const lpoSuccessorUser: SeatSessionUser = {
  ...lpoSeatUser,
  id: 'u-lpo-2',
  name: 'Hana LPO (Handover)',
};

const leoLoreSeatUser: SeatSessionUser = {
  id: 'u-leolore',
  name: 'Youssef Exchange',
  email: 'leo.lore.nvmsa@gmail.com',
  seatCode: 'LEO & LORE',
  seatTitle: 'Local Exchange Officer & Local Officer on Research Exchange',
  tier: 'officer_sc',
  allowedOrgUnits: ['SCOPE', 'SCORE'],
  defaultOrgUnitId: 'SCOPE',
  capabilities: getCapabilitiesForTier('officer_sc'),
};

const pnsddSeatUser: SeatSessionUser = {
  id: 'u-pnsdd',
  name: 'Omar PNSDD',
  email: 'pnsdd.nvmsa@gmail.com',
  seatCode: 'PNSDD',
  seatTitle: 'Publication & New Technology Support Division Director',
  tier: 'officer_sd_ops',
  allowedOrgUnits: ['PNSDD'],
  defaultOrgUnitId: 'PNSDD',
  capabilities: getCapabilitiesForTier('officer_sd_ops'),
};

const superAdminUser: SeatSessionUser = {
  id: 'u-superadmin',
  name: 'Mostafa Yaser',
  email: 'mostafa.yaser.developer@gmail.com',
  seatCode: 'SUPER_ADMIN',
  seatTitle: 'System Administrator',
  tier: 'super_admin',
  allowedOrgUnits: [],
  defaultOrgUnitId: 'EB',
  capabilities: getCapabilitiesForTier('super_admin'),
};

function createTestService() {
  const repo = new InMemorySlotRepository(SEED_ORG_UNITS);
  const service = new CalendarService(
    repo,
    defaultCalendarPolicy,
    () => new Date('2026-11-25T10:00:00.000Z'),
  );
  return { repo, service };
}

describe('CalendarService v1.0', () => {
  it('enforces unit-scoped booking and allows LEO & LORE to book SCOPE or SCORE', async () => {
    const { service } = createTestService();

    await expect(
      service.bookSlot(
        {
          postDate: '2026-12-01',
          orgUnitId: 'SCOME',
          contentType: 'POST',
          title: 'Cross-committee unauthorized book',
        },
        lpoSeatUser,
      ),
    ).rejects.toThrow(ForbiddenError);

    const scophRes = await service.bookSlot(
      {
        postDate: '2026-12-01',
        orgUnitId: 'SCOPH',
        contentType: 'POST',
        title: 'Diabetes Awareness Day',
      },
      lpoSeatUser,
    );
    if ('replayed' in scophRes) throw new Error('Unexpected replay');
    expect(scophRes.slot.ownerSeatCode).toBe('LPO');
    expect(scophRes.affectedMonths).toEqual(['2026-12']);

    const scoreRes = await service.bookSlot(
      {
        postDate: '2026-12-02',
        orgUnitId: 'SCORE',
        contentType: 'REEL',
        title: 'Research Exchange Call',
      },
      leoLoreSeatUser,
    );
    if ('replayed' in scoreRes) throw new Error('Unexpected replay');
    expect(scoreRes.slot.orgUnitId).toBe('SCORE');
  });

  it('inherits edit ownership via owner_seat_code across annual handovers', async () => {
    const { service } = createTestService();

    const created = await service.bookSlot(
      {
        postDate: '2026-12-04',
        orgUnitId: 'SCOPH',
        contentType: 'PHOTO',
        title: 'Predecessor Slot',
      },
      lpoSeatUser,
    );
    if ('replayed' in created) throw new Error('Unexpected replay');

    const edited = await service.updateSlot(
      created.slot.id,
      { title: 'Updated By New LPO', expectedVersion: 1 },
      lpoSuccessorUser,
    );
    if ('replayed' in edited) throw new Error('Unexpected replay');
    expect(edited.slot.title).toBe('Updated By New LPO');
    expect(edited.slot.version).toBe(2);

    await expect(
      service.updateSlot(
        created.slot.id,
        { title: 'Hijack by LEO', expectedVersion: 2 },
        leoLoreSeatUser,
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('returns 409 ConflictError with winning PublicSlotView & nextOpenDate, and 412 on stale OCC', async () => {
    const { service } = createTestService();

    const first = await service.bookSlot(
      {
        postDate: '2026-12-10',
        orgUnitId: 'SCOPH',
        contentType: 'POST',
        title: 'First Poster',
      },
      lpoSeatUser,
    );
    if ('replayed' in first) throw new Error('Unexpected replay');

    try {
      await service.bookSlot(
        {
          postDate: '2026-12-10',
          orgUnitId: 'SCORE',
          contentType: 'POST',
          title: 'Second Poster',
        },
        leoLoreSeatUser,
      );
      expect.unreachable('Should have thrown ConflictError');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      const err = error as ConflictError;
      const details = err.details as { winner: { title: string }; nextOpenDate: string };
      expect(details.winner.title).toBe('First Poster');
      expect(details.nextOpenDate).toBe('2026-12-11');
    }

    await expect(
      service.updateSlot(first.slot.id, { title: 'V2 Edit', expectedVersion: 1 }, lpoSeatUser),
    ).resolves.toBeTruthy();

    await expect(
      service.updateSlot(first.slot.id, { title: 'Stale V1', expectedVersion: 1 }, lpoSeatUser),
    ).rejects.toThrow(PreconditionFailedError);

    await expect(
      service.cancelSlot(first.slot.id, { expectedVersion: 1 }, lpoSeatUser),
    ).rejects.toThrow(PreconditionFailedError);
  });

  it('supports idempotency replay and rejects mismatched hash with 422', async () => {
    const { service } = createTestService();
    const ctx = {
      requestId: 'req-1',
      idempotencyKey: 'key-123',
      routeKey: 'POST /slots',
    };

    const first = await service.bookSlot(
      {
        postDate: '2026-12-14',
        orgUnitId: 'SCOPH',
        contentType: 'POST',
        title: 'Idempotent Campaign',
      },
      lpoSeatUser,
      ctx,
    );
    if ('replayed' in first) throw new Error('Should not be replay');

    const replay = await service.bookSlot(
      {
        postDate: '2026-12-14',
        orgUnitId: 'SCOPH',
        contentType: 'POST',
        title: 'Idempotent Campaign',
      },
      lpoSeatUser,
      ctx,
    );
    expect('replayed' in replay).toBe(true);

    await expect(
      service.bookSlot(
        {
          postDate: '2026-12-14',
          orgUnitId: 'SCOPH',
          contentType: 'POST',
          title: 'Mutated Payload Same Key',
        },
        lpoSeatUser,
        ctx,
      ),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('requires reason for super_admin mutations and masks super_admin identity from non-super_admin viewers', async () => {
    const { service } = createTestService();

    await expect(
      service.bookSlot(
        {
          postDate: '2026-11-20',
          orgUnitId: 'EB',
          contentType: 'POST',
          title: 'Break-glass Backfill',
        },
        superAdminUser,
      ),
    ).rejects.toThrow(ValidationError);

    const created = await service.bookSlot(
      {
        postDate: '2026-11-20',
        orgUnitId: 'EB',
        contentType: 'POST',
        title: 'Break-glass Backfill',
        reason: 'Historical import requested by PRES',
      },
      superAdminUser,
    );
    if ('replayed' in created) throw new Error('Unexpected replay');

    const publicMonth = await service.listMonth('2026-11', null);
    expect(publicMonth.slots[0]?.creatorName).toBe(MASKED_SUPER_ADMIN_LABEL);
    expect(publicMonth.slots[0]?.ownerSeatCode).toBe(MASKED_SUPER_ADMIN_ROLE);

    const pnsddHistory = await service.listSlotHistory(created.slot.id, pnsddSeatUser);
    expect(pnsddHistory[0]?.actorName).toBe(MASKED_SUPER_ADMIN_LABEL);
    expect(pnsddHistory[0]?.actorId).toBeNull();
    expect(pnsddHistory[0]?.actorRole).toBe(MASKED_SUPER_ADMIN_ROLE);

    const adminHistory = await service.listSlotHistory(created.slot.id, superAdminUser);
    expect(adminHistory[0]?.actorName).toBe('Mostafa Yaser');
    expect(adminHistory[0]?.actorRole).toBe('super_admin');
  });

  it('executes queue-relocation, cross-month relocation, and atomic override cleanly', async () => {
    const { service } = createTestService();

    const slot = await service.bookSlot(
      {
        postDate: '2026-11-29',
        orgUnitId: 'SCOPH',
        contentType: 'REEL',
        title: 'World Antimicrobial Week',
      },
      lpoSeatUser,
    );
    if ('replayed' in slot) throw new Error('Unexpected replay');

    const queued = await service.queueRelocation(
      slot.slot.id,
      { expectedVersion: 1, relocationReason: 'Design review pending' },
      lpoSeatUser,
    );
    if ('replayed' in queued) throw new Error('Unexpected replay');
    expect(queued.slot.status).toBe('PENDING_RELOCATION');
    expect(queued.slot.postDate).toBeNull();
    expect(queued.slot.previousDate).toBe('2026-11-29');

    const relocated = await service.relocateSlot(
      slot.slot.id,
      { expectedVersion: 2, targetDate: '2026-12-03' },
      lpoSeatUser,
    );
    if ('replayed' in relocated) throw new Error('Unexpected replay');
    expect(relocated.slot.status).toBe('BOOKED');
    expect(relocated.slot.postDate).toBe('2026-12-03');
    expect(relocated.affectedMonths).toEqual(['2026-12']);

    const overridden = await service.overrideSlot(
      {
        postDate: '2026-12-03',
        orgUnitId: 'PNSDD',
        contentType: 'STORY_CAMPAIGN',
        title: 'Emergency Assembly Campaign',
        reason: 'Urgent board announcement takes priority',
        expectedOccupantVersion: 3,
      },
      pnsddSeatUser,
    );
    if ('replayed' in overridden) throw new Error('Unexpected replay');
    expect(overridden.slot.orgUnitId).toBe('PNSDD');
    expect(overridden.displacedSlot?.status).toBe('PENDING_RELOCATION');
    expect(overridden.displacedSlot?.postDate).toBeNull();
  });
});
