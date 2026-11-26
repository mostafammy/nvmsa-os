import type {
  OfficeSeatView,
  OrgUnit,
  PatchOrgUnitInput,
  SeatSessionUser,
  UpdateSeatInput,
  UpsertOrgUnitInput,
} from '@shared/types';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../core/errors/domain-errors';
import type { IAdminRepository } from './admin.repository';

function assertCanManageGovernance(
  actor: SeatSessionUser | null,
  capability: 'canManageSeats' | 'canManageOrgUnits',
  reason?: string,
): SeatSessionUser {
  if (!actor) {
    throw new UnauthorizedError('Sign in to access governance controls');
  }
  if (!actor.capabilities[capability]) {
    throw new ForbiddenError('Only the President or System Administrator can manage governance');
  }
  if (actor.tier === 'super_admin' && (!reason || reason.trim().length < 3)) {
    throw new ValidationError('A reason (at least 3 characters) is required for platform actions');
  }
  return actor;
}

export class AdminService {
  constructor(
    private readonly repo: IAdminRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async listSeats(actor: SeatSessionUser | null): Promise<OfficeSeatView[]> {
    assertCanManageGovernance(actor, 'canManageSeats', 'read');
    return this.repo.listSeats();
  }

  async listOrgUnits(actor: SeatSessionUser | null): Promise<OrgUnit[]> {
    assertCanManageGovernance(actor, 'canManageOrgUnits', 'read');
    return this.repo.listOrgUnits();
  }

  async updateSeat(
    seatCode: string,
    input: UpdateSeatInput,
    actor: SeatSessionUser | null,
    requestId = 'unknown',
  ): Promise<OfficeSeatView> {
    const validActor = assertCanManageGovernance(actor, 'canManageSeats', input.reason);
    const existing = await this.repo.findSeatByCode(seatCode);
    if (!existing) {
      throw new NotFoundError(`Official seat "${seatCode}" not found`);
    }

    if (existing.tier === 'eb_president' && input.isActive === false) {
      const activePresCount = await this.repo.countActivePresidents();
      if (activePresCount <= 1) {
        throw new ConflictError('Cannot deactivate the sole active President seat');
      }
    }

    const normalizedNextEmail = input.assignedEmail?.trim().toLowerCase();
    const emailChanged =
      normalizedNextEmail !== undefined && normalizedNextEmail !== existing.assignedEmail;
    const deactivated = input.isActive === false && existing.isActive;
    const revokeOldSessions = emailChanged || deactivated;
    const nowIso = this.clock().toISOString();

    return this.repo.updateSeatAtomic({
      seatCode: existing.seatCode,
      previousEmail: existing.assignedEmail,
      nextEmail: normalizedNextEmail,
      nextIsActive: input.isActive,
      revokeOldSessions,
      updatedAt: nowIso,
      audit: {
        id: crypto.randomUUID(),
        targetType: 'SEAT',
        targetId: existing.seatCode,
        actorId: validActor.id,
        actorRole: validActor.tier,
        action: 'SEAT_UPDATED',
        diffJson: JSON.stringify({
          previousEmail: existing.assignedEmail,
          nextEmail: normalizedNextEmail ?? existing.assignedEmail,
          previousActive: existing.isActive,
          nextActive: input.isActive ?? existing.isActive,
          revokedSessions: revokeOldSessions,
          reason: input.reason ?? null,
        }),
        requestId,
        createdAt: nowIso,
      },
    });
  }

  async createOrgUnit(
    input: UpsertOrgUnitInput,
    actor: SeatSessionUser | null,
    requestId = 'unknown',
  ): Promise<OrgUnit> {
    const validActor = assertCanManageGovernance(actor, 'canManageOrgUnits', input.reason);
    const code = input.code.trim().toUpperCase();
    const nowIso = this.clock().toISOString();

    return this.repo.upsertOrgUnitAtomic({
      id: code,
      code,
      name: input.name.trim(),
      kind: input.kind,
      accentToken: input.accentToken,
      isActive: input.isActive,
      isCreate: true,
      nowIso,
      audit: {
        id: crypto.randomUUID(),
        targetType: 'ORG_UNIT',
        targetId: code,
        actorId: validActor.id,
        actorRole: validActor.tier,
        action: 'ORG_UNIT_CREATED',
        diffJson: JSON.stringify({
          code,
          name: input.name.trim(),
          kind: input.kind,
          accentToken: input.accentToken,
          isActive: input.isActive,
          reason: input.reason ?? null,
        }),
        requestId,
        createdAt: nowIso,
      },
    });
  }

  async updateOrgUnit(
    id: string,
    input: PatchOrgUnitInput,
    actor: SeatSessionUser | null,
    requestId = 'unknown',
  ): Promise<OrgUnit> {
    const validActor = assertCanManageGovernance(actor, 'canManageOrgUnits', input.reason);
    const existing = await this.repo.findOrgUnitById(id);
    if (!existing) {
      throw new NotFoundError(`Organization unit "${id}" not found`);
    }

    const nowIso = this.clock().toISOString();
    return this.repo.upsertOrgUnitAtomic({
      id: existing.id,
      code: existing.code,
      name: input.name?.trim() ?? existing.name,
      kind: input.kind ?? existing.kind,
      accentToken: input.accentToken ?? existing.accentToken,
      isActive: input.isActive ?? existing.isActive,
      isCreate: false,
      nowIso,
      audit: {
        id: crypto.randomUUID(),
        targetType: 'ORG_UNIT',
        targetId: existing.id,
        actorId: validActor.id,
        actorRole: validActor.tier,
        action: 'ORG_UNIT_UPDATED',
        diffJson: JSON.stringify({
          before: {
            name: existing.name,
            kind: existing.kind,
            accentToken: existing.accentToken,
            isActive: existing.isActive,
          },
          after: {
            name: input.name?.trim() ?? existing.name,
            kind: input.kind ?? existing.kind,
            accentToken: input.accentToken ?? existing.accentToken,
            isActive: input.isActive ?? existing.isActive,
          },
          reason: input.reason ?? null,
        }),
        requestId,
        createdAt: nowIso,
      },
    });
  }
}
