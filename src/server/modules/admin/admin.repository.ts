import { asc, eq, inArray, sql } from 'drizzle-orm';
import type { AccentToken } from '@shared/constants';
import type { OfficeSeatView, OrgUnit, OrgUnitKind } from '@shared/types';
import type { AppDatabase } from '../../core/db/client';
import { sessions, users } from '../../core/db/schema';
import { ConflictError } from '../../core/errors/domain-errors';
import {
  officeSeats,
  orgUnits,
  seatAllowedUnits,
  seatAuditLogs,
  type NewSeatAuditLogRow,
  type OfficeSeatRow,
  type OrgUnitRow,
} from './admin.table';

export interface UpdateSeatAtomicCommand {
  seatCode: string;
  previousEmail: string;
  nextEmail?: string;
  nextIsActive?: boolean;
  revokeOldSessions: boolean;
  updatedAt: string;
  audit: NewSeatAuditLogRow;
}

export interface UpsertOrgUnitAtomicCommand {
  id: string;
  code: string;
  name: string;
  kind: OrgUnitKind;
  accentToken: AccentToken;
  isActive: boolean;
  isCreate: boolean;
  nowIso: string;
  audit: NewSeatAuditLogRow;
}

export interface IAdminRepository {
  listOrgUnits(): Promise<OrgUnit[]>;
  findOrgUnitById(id: string): Promise<OrgUnit | null>;
  upsertOrgUnitAtomic(cmd: UpsertOrgUnitAtomicCommand): Promise<OrgUnit>;
  listSeats(): Promise<OfficeSeatView[]>;
  findSeatByCode(seatCode: string): Promise<OfficeSeatView | null>;
  countActivePresidents(): Promise<number>;
  updateSeatAtomic(cmd: UpdateSeatAtomicCommand): Promise<OfficeSeatView>;
}

function mapOrgUnitRow(row: OrgUnitRow): OrgUnit {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    kind: row.kind,
    accentToken: row.accentToken,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSeatRow(row: OfficeSeatRow, allowedOrgUnits: string[]): OfficeSeatView {
  return {
    seatCode: row.seatCode,
    branch: row.branch,
    title: row.title,
    tier: row.tier,
    assignedEmail: row.assignedEmail,
    isActive: row.isActive,
    allowedOrgUnits,
    updatedAt: row.updatedAt,
  };
}

function isUniqueConstraintFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('unique constraint failed') || msg.includes('sqlite_constraint_unique');
}

export class D1AdminRepository implements IAdminRepository {
  constructor(private readonly db: AppDatabase) {}

  async listOrgUnits(): Promise<OrgUnit[]> {
    const rows = await this.db.select().from(orgUnits).orderBy(asc(orgUnits.kind), asc(orgUnits.code));
    return rows.map(mapOrgUnitRow);
  }

  async findOrgUnitById(id: string): Promise<OrgUnit | null> {
    const [row] = await this.db.select().from(orgUnits).where(eq(orgUnits.id, id)).limit(1);
    return row ? mapOrgUnitRow(row) : null;
  }

  async upsertOrgUnitAtomic(cmd: UpsertOrgUnitAtomicCommand): Promise<OrgUnit> {
    try {
      const writeOp = cmd.isCreate
        ? this.db.insert(orgUnits).values({
            id: cmd.id,
            code: cmd.code,
            name: cmd.name,
            kind: cmd.kind,
            accentToken: cmd.accentToken,
            isActive: cmd.isActive,
            createdAt: cmd.nowIso,
            updatedAt: cmd.nowIso,
          })
        : this.db
            .update(orgUnits)
            .set({
              name: cmd.name,
              kind: cmd.kind,
              accentToken: cmd.accentToken,
              isActive: cmd.isActive,
              updatedAt: cmd.nowIso,
            })
            .where(eq(orgUnits.id, cmd.id));

      await this.db.batch([writeOp, this.db.insert(seatAuditLogs).values(cmd.audit)]);
    } catch (error) {
      if (isUniqueConstraintFailure(error)) {
        throw new ConflictError(`Organization unit code "${cmd.code}" already exists`);
      }
      throw error;
    }

    const saved = await this.findOrgUnitById(cmd.id);
    if (!saved) {
      throw new Error(`Failed to reload org unit ${cmd.id} after atomic write`);
    }
    return saved;
  }

  async listSeats(): Promise<OfficeSeatView[]> {
    const [seatRows, scopeRows] = await Promise.all([
      this.db.select().from(officeSeats).orderBy(asc(officeSeats.branch), asc(officeSeats.seatCode)),
      this.db.select().from(seatAllowedUnits),
    ]);

    const scopesBySeat = new Map<string, string[]>();
    for (const scope of scopeRows) {
      const existing = scopesBySeat.get(scope.seatCode) ?? [];
      existing.push(scope.orgUnitId);
      scopesBySeat.set(scope.seatCode, existing);
    }

    return seatRows.map((seat) => mapSeatRow(seat, scopesBySeat.get(seat.seatCode) ?? []));
  }

  async findSeatByCode(seatCode: string): Promise<OfficeSeatView | null> {
    const [seat] = await this.db
      .select()
      .from(officeSeats)
      .where(eq(officeSeats.seatCode, seatCode))
      .limit(1);
    if (!seat) {
      return null;
    }

    const scopeRows = await this.db
      .select({ orgUnitId: seatAllowedUnits.orgUnitId })
      .from(seatAllowedUnits)
      .where(eq(seatAllowedUnits.seatCode, seatCode));

    return mapSeatRow(
      seat,
      scopeRows.map((row) => row.orgUnitId),
    );
  }

  async countActivePresidents(): Promise<number> {
    const rows = await this.db
      .select({ seatCode: officeSeats.seatCode })
      .from(officeSeats)
      .where(sql`${officeSeats.tier} = 'eb_president' AND ${officeSeats.isActive} = 1`);
    return rows.length;
  }

  async updateSeatAtomic(cmd: UpdateSeatAtomicCommand): Promise<OfficeSeatView> {
    const patch: Partial<typeof officeSeats.$inferInsert> = {
      updatedAt: cmd.updatedAt,
      ...(cmd.nextEmail !== undefined ? { assignedEmail: cmd.nextEmail } : {}),
      ...(cmd.nextIsActive !== undefined ? { isActive: cmd.nextIsActive } : {}),
    };

    try {
      const updateOp = this.db
        .update(officeSeats)
        .set(patch)
        .where(eq(officeSeats.seatCode, cmd.seatCode));

      const auditOp = this.db.insert(seatAuditLogs).values(cmd.audit);

      if (cmd.revokeOldSessions) {
        const oldUserSubquery = this.db
          .select({ id: users.id })
          .from(users)
          .where(sql`lower(${users.email}) = ${cmd.previousEmail.toLowerCase()}`);

        const revokeOp = this.db.delete(sessions).where(inArray(sessions.userId, oldUserSubquery));
        await this.db.batch([updateOp, auditOp, revokeOp]);
      } else {
        await this.db.batch([updateOp, auditOp]);
      }
    } catch (error) {
      if (isUniqueConstraintFailure(error)) {
        throw new ConflictError(
          `Email "${cmd.nextEmail ?? ''}" is already assigned to another official seat`,
        );
      }
      throw error;
    }

    const updated = await this.findSeatByCode(cmd.seatCode);
    if (!updated) {
      throw new Error(`Seat ${cmd.seatCode} vanished after update`);
    }
    return updated;
  }
}

export class InMemoryAdminRepository implements IAdminRepository {
  private readonly unitsMap = new Map<string, OrgUnit>();
  private readonly seatsMap = new Map<string, OfficeSeatView>();
  readonly auditLogs: NewSeatAuditLogRow[] = [];
  readonly activeSessionsByEmail = new Map<string, string[]>();

  constructor(seedUnits: OrgUnit[] = [], seedSeats: OfficeSeatView[] = []) {
    for (const unit of seedUnits) {
      this.unitsMap.set(unit.id, { ...unit });
    }
    for (const seat of seedSeats) {
      this.seatsMap.set(seat.seatCode, { ...seat, allowedOrgUnits: [...seat.allowedOrgUnits] });
    }
  }

  async listOrgUnits(): Promise<OrgUnit[]> {
    return [...this.unitsMap.values()]
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.code.localeCompare(b.code))
      .map((u) => ({ ...u }));
  }

  async findOrgUnitById(id: string): Promise<OrgUnit | null> {
    const unit = this.unitsMap.get(id);
    return unit ? { ...unit } : null;
  }

  async upsertOrgUnitAtomic(cmd: UpsertOrgUnitAtomicCommand): Promise<OrgUnit> {
    if (cmd.isCreate) {
      for (const existing of this.unitsMap.values()) {
        if (existing.code === cmd.code || existing.id === cmd.id) {
          throw new ConflictError(`Organization unit code "${cmd.code}" already exists`);
        }
      }
    }

    const existing = this.unitsMap.get(cmd.id);
    const saved: OrgUnit = {
      id: cmd.id,
      code: cmd.code,
      name: cmd.name,
      kind: cmd.kind,
      accentToken: cmd.accentToken,
      isActive: cmd.isActive,
      createdAt: existing?.createdAt ?? cmd.nowIso,
      updatedAt: cmd.nowIso,
    };
    this.unitsMap.set(saved.id, saved);
    this.auditLogs.push({ ...cmd.audit });
    return { ...saved };
  }

  async listSeats(): Promise<OfficeSeatView[]> {
    return [...this.seatsMap.values()]
      .sort((a, b) => a.branch.localeCompare(b.branch) || a.seatCode.localeCompare(b.seatCode))
      .map((s) => ({ ...s, allowedOrgUnits: [...s.allowedOrgUnits] }));
  }

  async findSeatByCode(seatCode: string): Promise<OfficeSeatView | null> {
    const seat = this.seatsMap.get(seatCode);
    return seat ? { ...seat, allowedOrgUnits: [...seat.allowedOrgUnits] } : null;
  }

  async countActivePresidents(): Promise<number> {
    return [...this.seatsMap.values()].filter(
      (s) => s.tier === 'eb_president' && s.isActive,
    ).length;
  }

  async updateSeatAtomic(cmd: UpdateSeatAtomicCommand): Promise<OfficeSeatView> {
    const current = this.seatsMap.get(cmd.seatCode);
    if (!current) {
      throw new Error(`Seat ${cmd.seatCode} not found`);
    }

    if (cmd.nextEmail !== undefined) {
      for (const other of this.seatsMap.values()) {
        if (other.seatCode !== cmd.seatCode && other.assignedEmail === cmd.nextEmail) {
          throw new ConflictError(
            `Email "${cmd.nextEmail}" is already assigned to another official seat`,
          );
        }
      }
    }

    const updated: OfficeSeatView = {
      ...current,
      assignedEmail: cmd.nextEmail ?? current.assignedEmail,
      isActive: cmd.nextIsActive ?? current.isActive,
      updatedAt: cmd.updatedAt,
    };

    if (cmd.revokeOldSessions) {
      this.activeSessionsByEmail.delete(cmd.previousEmail.toLowerCase());
    }
    this.seatsMap.set(cmd.seatCode, updated);
    this.auditLogs.push({ ...cmd.audit });
    return { ...updated, allowedOrgUnits: [...updated.allowedOrgUnits] };
  }
}
