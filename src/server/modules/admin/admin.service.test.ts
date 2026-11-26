import { describe, expect, it } from 'vitest';
import { CANONICAL_ORG_UNITS, getCapabilitiesForTier } from '@shared/constants';
import type { OfficeSeatView, OrgUnit, SeatSessionUser } from '@shared/types';
import { ConflictError, ForbiddenError, ValidationError } from '../../core/errors/domain-errors';
import { InMemoryAdminRepository } from './admin.repository';
import { AdminService } from './admin.service';

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

const SEED_SEATS: OfficeSeatView[] = [
  {
    seatCode: 'PRES',
    branch: 'EXECUTIVE_BOARD',
    title: 'President',
    tier: 'eb_president',
    assignedEmail: 'president.nvmsa@gmail.com',
    isActive: true,
    allowedOrgUnits: ['EB'],
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    seatCode: 'LPO',
    branch: 'STANDING_COMMITTEE',
    title: 'Local Public Health Officer',
    tier: 'officer_sc',
    assignedEmail: 'lpoo.nvmsa@gmail.com',
    isActive: true,
    allowedOrgUnits: ['SCOPH'],
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const presActor: SeatSessionUser = {
  id: 'u-pres',
  name: 'NVMSA President',
  email: 'president.nvmsa@gmail.com',
  seatCode: 'PRES',
  seatTitle: 'President',
  tier: 'eb_president',
  allowedOrgUnits: ['EB'],
  defaultOrgUnitId: 'EB',
  capabilities: getCapabilitiesForTier('eb_president'),
};

const ebActor: SeatSessionUser = {
  id: 'u-vp',
  name: 'NVMSA VP',
  email: 'vp.nvmsa@gmail.com',
  seatCode: 'VP',
  seatTitle: 'Vice President',
  tier: 'eb',
  allowedOrgUnits: ['EB'],
  defaultOrgUnitId: 'EB',
  capabilities: getCapabilitiesForTier('eb'),
};

const superAdminActor: SeatSessionUser = {
  id: 'u-sa',
  name: 'Mostafa Yaser',
  email: 'mostafa.yaser.developer@gmail.com',
  seatCode: 'SUPER_ADMIN',
  seatTitle: 'System Administrator',
  tier: 'super_admin',
  allowedOrgUnits: [],
  defaultOrgUnitId: 'EB',
  capabilities: getCapabilitiesForTier('super_admin'),
};

describe('AdminService Governance', () => {
  it('denies non-PRES/non-super_admin users from listing or mutating seats', async () => {
    const repo = new InMemoryAdminRepository(SEED_UNITS, SEED_SEATS);
    const service = new AdminService(repo);

    await expect(service.listSeats(ebActor)).rejects.toThrow(ForbiddenError);
    await expect(
      service.updateSeat('LPO', { assignedEmail: 'new.lpo@gmail.com' }, ebActor),
    ).rejects.toThrow(ForbiddenError);
  });

  it('revokes active sessions of displaced email atomically when PRES reassigns a seat', async () => {
    const repo = new InMemoryAdminRepository(SEED_UNITS, SEED_SEATS);
    repo.activeSessionsByEmail.set('lpoo.nvmsa@gmail.com', ['sess-1', 'sess-2']);
    const service = new AdminService(repo, () => new Date('2026-11-26T12:00:00.000Z'));

    const updated = await service.updateSeat(
      'LPO',
      { assignedEmail: '  LPO.2027@gmail.com ' },
      presActor,
      'req-handover',
    );

    expect(updated.assignedEmail).toBe('lpo.2027@gmail.com');
    expect(repo.activeSessionsByEmail.has('lpoo.nvmsa@gmail.com')).toBe(false);
    expect(repo.auditLogs).toHaveLength(1);
    expect(repo.auditLogs[0]?.action).toBe('SEAT_UPDATED');
  });

  it('prevents deactivating the sole active PRES seat', async () => {
    const repo = new InMemoryAdminRepository(SEED_UNITS, SEED_SEATS);
    const service = new AdminService(repo);

    await expect(
      service.updateSeat('PRES', { isActive: false }, presActor),
    ).rejects.toThrow(ConflictError);
  });

  it('requires a reason when super_admin modifies governance records and keeps super_admin hidden from seat lists', async () => {
    const repo = new InMemoryAdminRepository(SEED_UNITS, SEED_SEATS);
    const service = new AdminService(repo);

    const visibleSeats = await service.listSeats(presActor);
    expect(visibleSeats.some((s) => (s.tier as string) === 'super_admin')).toBe(false);

    await expect(
      service.createOrgUnit(
        { code: 'MEDTECH', name: 'MedTech Unit', kind: 'DIVISION', accentToken: 'teal', isActive: true },
        superAdminActor,
      ),
    ).rejects.toThrow(ValidationError);

    const created = await service.createOrgUnit(
      {
        code: 'MEDTECH',
        name: 'MedTech Unit',
        kind: 'DIVISION',
        accentToken: 'teal',
        isActive: true,
        reason: 'Approved by General Assembly',
      },
      superAdminActor,
    );
    expect(created.id).toBe('MEDTECH');
    expect(created.accentToken).toBe('teal');
  });
});
