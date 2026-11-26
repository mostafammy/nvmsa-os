import type { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import type { ContentType, OrgUnit, SlotStatus } from '@shared/types';
import type { AppDatabase } from '../../core/db/client';
import { orgUnits } from '../../core/db/schema';
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
} from '../../core/errors/domain-errors';
import {
  idempotencyKeys,
  postSlots,
  slotAuditLogs,
  type IdempotencyKeyRow,
  type NewIdempotencyKeyRow,
  type NewPostSlotRow,
  type NewSlotAuditLogRow,
  type PostSlotRow,
  type SlotAuditLogRow,
} from './calendar.table';

export interface IdempotencyRecordInput {
  key: string;
  userId: string;
  route: string;
  requestHash: string;
  responseCode: number;
  responseBody: string;
  createdAt: string;
  expiresAt: string;
}

export interface BookSlotAtomicCommand {
  slot: NewPostSlotRow;
  audit: NewSlotAuditLogRow;
  idempotency?: IdempotencyRecordInput;
}

export interface UpdateSlotAtomicCommand {
  id: string;
  expectedVersion: number;
  nextMutationId: string;
  patch: {
    orgUnitId: string;
    contentType: ContentType;
    title: string;
    notes: string | null;
    assetUrl: string | null;
  };
  nowIso: string;
  audit: Omit<NewSlotAuditLogRow, 'slotId'>;
  idempotency?: IdempotencyRecordInput;
}

export interface QueueRelocationAtomicCommand {
  id: string;
  expectedVersion: number;
  nextMutationId: string;
  relocationReason: string;
  previousDate: string | null;
  nowIso: string;
  audit: Omit<NewSlotAuditLogRow, 'slotId'>;
  idempotency?: IdempotencyRecordInput;
}

export interface RelocateSlotAtomicCommand {
  id: string;
  expectedVersion: number;
  nextMutationId: string;
  targetDate: string;
  nowIso: string;
  audit: Omit<NewSlotAuditLogRow, 'slotId'>;
  idempotency?: IdempotencyRecordInput;
}

export interface CancelSlotAtomicCommand {
  id: string;
  expectedVersion: number;
  nextMutationId: string;
  nowIso: string;
  audit: Omit<NewSlotAuditLogRow, 'slotId'>;
  idempotency?: IdempotencyRecordInput;
}

export interface OverrideSlotAtomicCommand {
  newSlot: NewPostSlotRow;
  newAudit: NewSlotAuditLogRow;
  displaced?: {
    id: string;
    expectedVersion: number;
    nextMutationId: string;
    previousDate: string;
    relocationReason: string;
    audit: Omit<NewSlotAuditLogRow, 'slotId'>;
  };
  nowIso: string;
  idempotency?: IdempotencyRecordInput;
}

export interface OverrideSlotAtomicResult {
  created: PostSlotRow;
  displaced: PostSlotRow | null;
}

export interface ISlotRepository {
  listOrgUnits(): Promise<OrgUnit[]>;
  findOrgUnitById(id: string): Promise<OrgUnit | null>;
  findById(id: string): Promise<PostSlotRow | null>;
  findBookedByDate(postDate: string): Promise<PostSlotRow | null>;
  listBookedInRange(gridStart: string, gridEnd: string): Promise<PostSlotRow[]>;
  listBookedDatesAfter(startDate: string, limit?: number): Promise<string[]>;
  listRelocationQueue(limit?: number): Promise<PostSlotRow[]>;
  listAuditLogs(slotId: string): Promise<SlotAuditLogRow[]>;
  findIdempotencyRecord(
    key: string,
    userId: string,
    route: string,
    nowIso: string,
  ): Promise<IdempotencyKeyRow | null>;
  pruneExpiredIdempotencyKeys(nowIso: string, limit?: number): Promise<void>;
  bookSlotAtomic(cmd: BookSlotAtomicCommand): Promise<PostSlotRow>;
  updateSlotAtomic(cmd: UpdateSlotAtomicCommand): Promise<PostSlotRow>;
  queueRelocationAtomic(cmd: QueueRelocationAtomicCommand): Promise<PostSlotRow>;
  relocateSlotAtomic(cmd: RelocateSlotAtomicCommand): Promise<PostSlotRow>;
  overrideSlotAtomic(cmd: OverrideSlotAtomicCommand): Promise<OverrideSlotAtomicResult>;
  cancelSlotAtomic(cmd: CancelSlotAtomicCommand): Promise<PostSlotRow>;
}

function isActiveDateCollisionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('uq_active_post_date') ||
    (msg.includes('unique constraint failed') && msg.includes('post_slots.post_date'))
  );
}

function mapOrgUnitRow(row: typeof orgUnits.$inferSelect): OrgUnit {
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

export class D1SlotRepository implements ISlotRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly d1: D1Database,
  ) {}

  async listOrgUnits(): Promise<OrgUnit[]> {
    const rows = await this.db
      .select()
      .from(orgUnits)
      .where(eq(orgUnits.isActive, true))
      .orderBy(asc(orgUnits.kind), asc(orgUnits.code));
    return rows.map(mapOrgUnitRow);
  }

  async findOrgUnitById(id: string): Promise<OrgUnit | null> {
    const [row] = await this.db.select().from(orgUnits).where(eq(orgUnits.id, id)).limit(1);
    return row ? mapOrgUnitRow(row) : null;
  }

  async findById(id: string): Promise<PostSlotRow | null> {
    const [row] = await this.db.select().from(postSlots).where(eq(postSlots.id, id)).limit(1);
    return row ?? null;
  }

  async findBookedByDate(postDate: string): Promise<PostSlotRow | null> {
    const [row] = await this.db
      .select()
      .from(postSlots)
      .where(and(eq(postSlots.postDate, postDate), eq(postSlots.status, 'BOOKED')))
      .limit(1);
    return row ?? null;
  }

  async listBookedInRange(gridStart: string, gridEnd: string): Promise<PostSlotRow[]> {
    return this.db
      .select()
      .from(postSlots)
      .where(
        and(
          eq(postSlots.status, 'BOOKED'),
          gte(postSlots.postDate, gridStart),
          lte(postSlots.postDate, gridEnd),
        ),
      )
      .orderBy(asc(postSlots.postDate));
  }

  async listBookedDatesAfter(startDate: string, limit = 90): Promise<string[]> {
    const rows = await this.db
      .select({ postDate: postSlots.postDate })
      .from(postSlots)
      .where(and(eq(postSlots.status, 'BOOKED'), gte(postSlots.postDate, startDate)))
      .orderBy(asc(postSlots.postDate))
      .limit(limit);
    return rows.map((r) => r.postDate).filter((d): d is string => d !== null);
  }

  async listRelocationQueue(limit = 100): Promise<PostSlotRow[]> {
    return this.db
      .select()
      .from(postSlots)
      .where(eq(postSlots.status, 'PENDING_RELOCATION'))
      .orderBy(asc(postSlots.updatedAt))
      .limit(limit);
  }

  async listAuditLogs(slotId: string): Promise<SlotAuditLogRow[]> {
    return this.db
      .select()
      .from(slotAuditLogs)
      .where(eq(slotAuditLogs.slotId, slotId))
      .orderBy(desc(slotAuditLogs.createdAt));
  }

  async findIdempotencyRecord(
    key: string,
    userId: string,
    route: string,
    nowIso: string,
  ): Promise<IdempotencyKeyRow | null> {
    const [row] = await this.db
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.key, key),
          eq(idempotencyKeys.userId, userId),
          eq(idempotencyKeys.route, route),
          gte(idempotencyKeys.expiresAt, nowIso),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async pruneExpiredIdempotencyKeys(nowIso: string, limit = 20): Promise<void> {
    await this.d1
      .prepare(
        'DELETE FROM idempotency_keys WHERE rowid IN (SELECT rowid FROM idempotency_keys WHERE expires_at < ? LIMIT ?)',
      )
      .bind(nowIso, limit)
      .run();
  }

  private buildGuardedAuditStatement(
    slotId: string,
    mutationId: string,
    audit: Omit<NewSlotAuditLogRow, 'slotId'>,
  ): D1PreparedStatement {
    return this.d1
      .prepare(
        `INSERT INTO slot_audit_log (id, slot_id, actor_id, actor_name, actor_role, action, diff_json, request_id, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
         FROM post_slots
         WHERE id = ? AND last_mutation_id = ?`,
      )
      .bind(
        audit.id,
        slotId,
        audit.actorId,
        audit.actorName,
        audit.actorRole,
        audit.action,
        audit.diffJson,
        audit.requestId,
        audit.createdAt,
        slotId,
        mutationId,
      );
  }

  private buildGuardedIdempotencyStatement(
    slotId: string,
    mutationId: string,
    idemp: IdempotencyRecordInput,
  ): D1PreparedStatement {
    return this.d1
      .prepare(
        `INSERT INTO idempotency_keys (key, user_id, route, request_hash, response_code, response_body, created_at, expires_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
         FROM post_slots
         WHERE id = ? AND last_mutation_id = ?`,
      )
      .bind(
        idemp.key,
        idemp.userId,
        idemp.route,
        idemp.requestHash,
        idemp.responseCode,
        idemp.responseBody,
        idemp.createdAt,
        idemp.expiresAt,
        slotId,
        mutationId,
      );
  }

  async bookSlotAtomic(cmd: BookSlotAtomicCommand): Promise<PostSlotRow> {
    const s = cmd.slot;
    const statements: D1PreparedStatement[] = [
      this.d1
        .prepare(
          `INSERT INTO post_slots (id, post_date, status, org_unit_id, content_type, title, notes, asset_url, relocation_reason, previous_date, owner_seat_code, created_by_id, created_by_name, version, last_mutation_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          s.id,
          s.postDate ?? null,
          s.status ?? 'BOOKED',
          s.orgUnitId,
          s.contentType ?? 'POST',
          s.title,
          s.notes ?? null,
          s.assetUrl ?? null,
          s.relocationReason ?? null,
          s.previousDate ?? null,
          s.ownerSeatCode,
          s.createdById,
          s.createdByName,
          s.version ?? 1,
          s.lastMutationId,
          s.createdAt,
          s.updatedAt,
        ),
      this.d1
        .prepare(
          `INSERT INTO slot_audit_log (id, slot_id, actor_id, actor_name, actor_role, action, diff_json, request_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          cmd.audit.id,
          cmd.audit.slotId,
          cmd.audit.actorId,
          cmd.audit.actorName,
          cmd.audit.actorRole,
          cmd.audit.action,
          cmd.audit.diffJson,
          cmd.audit.requestId,
          cmd.audit.createdAt,
        ),
    ];

    if (cmd.idempotency) {
      const idemp = cmd.idempotency;
      statements.push(
        this.d1
          .prepare(
            `INSERT INTO idempotency_keys (key, user_id, route, request_hash, response_code, response_body, created_at, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            idemp.key,
            idemp.userId,
            idemp.route,
            idemp.requestHash,
            idemp.responseCode,
            idemp.responseBody,
            idemp.createdAt,
            idemp.expiresAt,
          ),
      );
    }

    try {
      await this.d1.batch(statements);
    } catch (error) {
      if (isActiveDateCollisionError(error)) {
        throw new ConflictError(`Date ${s.postDate ?? ''} is already booked`);
      }
      throw error;
    }

    const inserted = await this.findById(s.id);
    if (!inserted) {
      throw new Error('Failed to load booked slot after batch commit');
    }
    return inserted;
  }

  private async executeGuardedMutation(
    id: string,
    expectedVersion: number,
    nextMutationId: string,
    updateStmt: D1PreparedStatement,
    audit: Omit<NewSlotAuditLogRow, 'slotId'>,
    idempotency?: IdempotencyRecordInput,
    targetDateForConflictMsg?: string,
  ): Promise<PostSlotRow> {
    const statements: D1PreparedStatement[] = [
      updateStmt,
      this.buildGuardedAuditStatement(id, nextMutationId, audit),
    ];
    if (idempotency) {
      statements.push(this.buildGuardedIdempotencyStatement(id, nextMutationId, idempotency));
    }

    let results: D1Result[];
    try {
      results = await this.d1.batch(statements);
    } catch (error) {
      if (isActiveDateCollisionError(error)) {
        throw new ConflictError(
          `Target date ${targetDateForConflictMsg ?? ''} is already booked`,
        );
      }
      throw error;
    }

    const updatedChanges = results[0]?.meta?.changes ?? 0;
    const current = await this.findById(id);

    if (updatedChanges === 0) {
      if (!current || current.status === 'CANCELLED') {
        throw new NotFoundError('Content slot not found');
      }
      if (current.version !== expectedVersion) {
        throw new PreconditionFailedError(
          'This slot was updated by someone else. Review the latest state and try again.',
          { latest: current },
        );
      }
      throw new PreconditionFailedError('Slot state changed concurrently. Refresh and try again.');
    }

    if (!current) {
      throw new NotFoundError('Content slot not found');
    }
    return current;
  }

  async updateSlotAtomic(cmd: UpdateSlotAtomicCommand): Promise<PostSlotRow> {
    const updateStmt = this.d1
      .prepare(
        `UPDATE post_slots
         SET org_unit_id = ?, content_type = ?, title = ?, notes = ?, asset_url = ?,
             version = version + 1, last_mutation_id = ?, updated_at = ?
         WHERE id = ? AND version = ? AND status != 'CANCELLED'`,
      )
      .bind(
        cmd.patch.orgUnitId,
        cmd.patch.contentType,
        cmd.patch.title,
        cmd.patch.notes,
        cmd.patch.assetUrl,
        cmd.nextMutationId,
        cmd.nowIso,
        cmd.id,
        cmd.expectedVersion,
      );

    return this.executeGuardedMutation(
      cmd.id,
      cmd.expectedVersion,
      cmd.nextMutationId,
      updateStmt,
      cmd.audit,
      cmd.idempotency,
    );
  }

  async queueRelocationAtomic(cmd: QueueRelocationAtomicCommand): Promise<PostSlotRow> {
    const updateStmt = this.d1
      .prepare(
        `UPDATE post_slots
         SET status = 'PENDING_RELOCATION', post_date = NULL, previous_date = ?,
             relocation_reason = ?, version = version + 1, last_mutation_id = ?, updated_at = ?
         WHERE id = ? AND version = ? AND status = 'BOOKED'`,
      )
      .bind(
        cmd.previousDate,
        cmd.relocationReason,
        cmd.nextMutationId,
        cmd.nowIso,
        cmd.id,
        cmd.expectedVersion,
      );

    return this.executeGuardedMutation(
      cmd.id,
      cmd.expectedVersion,
      cmd.nextMutationId,
      updateStmt,
      cmd.audit,
      cmd.idempotency,
    );
  }

  async relocateSlotAtomic(cmd: RelocateSlotAtomicCommand): Promise<PostSlotRow> {
    const updateStmt = this.d1
      .prepare(
        `UPDATE post_slots
         SET status = 'BOOKED', post_date = ?, relocation_reason = NULL,
             version = version + 1, last_mutation_id = ?, updated_at = ?
         WHERE id = ? AND version = ? AND status != 'CANCELLED'`,
      )
      .bind(cmd.targetDate, cmd.nextMutationId, cmd.nowIso, cmd.id, cmd.expectedVersion);

    return this.executeGuardedMutation(
      cmd.id,
      cmd.expectedVersion,
      cmd.nextMutationId,
      updateStmt,
      cmd.audit,
      cmd.idempotency,
      cmd.targetDate,
    );
  }

  async overrideSlotAtomic(cmd: OverrideSlotAtomicCommand): Promise<OverrideSlotAtomicResult> {
    const s = cmd.newSlot;
    const statements: D1PreparedStatement[] = [];

    if (cmd.displaced) {
      const d = cmd.displaced;
      statements.push(
        this.d1
          .prepare(
            `UPDATE post_slots
             SET status = 'PENDING_RELOCATION', post_date = NULL, previous_date = ?,
                 relocation_reason = ?, version = version + 1, last_mutation_id = ?, updated_at = ?
             WHERE id = ? AND status = 'BOOKED' AND version = ?`,
          )
          .bind(
            d.previousDate,
            d.relocationReason,
            d.nextMutationId,
            cmd.nowIso,
            d.id,
            d.expectedVersion,
          ),
        this.buildGuardedAuditStatement(d.id, d.nextMutationId, d.audit),
        this.d1
          .prepare(
            `INSERT INTO post_slots (id, post_date, status, org_unit_id, content_type, title, notes, asset_url, relocation_reason, previous_date, owner_seat_code, created_by_id, created_by_name, version, last_mutation_id, created_at, updated_at)
             SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
             WHERE EXISTS (SELECT 1 FROM post_slots WHERE id = ? AND last_mutation_id = ?)`,
          )
          .bind(
            s.id,
            s.postDate ?? null,
            s.status ?? 'BOOKED',
            s.orgUnitId,
            s.contentType ?? 'POST',
            s.title,
            s.notes ?? null,
            s.assetUrl ?? null,
            s.relocationReason ?? null,
            s.previousDate ?? null,
            s.ownerSeatCode,
            s.createdById,
            s.createdByName,
            s.version ?? 1,
            s.lastMutationId,
            s.createdAt,
            s.updatedAt,
            d.id,
            d.nextMutationId,
          ),
      );
    } else {
      statements.push(
        this.d1
          .prepare(
            `INSERT INTO post_slots (id, post_date, status, org_unit_id, content_type, title, notes, asset_url, relocation_reason, previous_date, owner_seat_code, created_by_id, created_by_name, version, last_mutation_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            s.id,
            s.postDate ?? null,
            s.status ?? 'BOOKED',
            s.orgUnitId,
            s.contentType ?? 'POST',
            s.title,
            s.notes ?? null,
            s.assetUrl ?? null,
            s.relocationReason ?? null,
            s.previousDate ?? null,
            s.ownerSeatCode,
            s.createdById,
            s.createdByName,
            s.version ?? 1,
            s.lastMutationId,
            s.createdAt,
            s.updatedAt,
          ),
      );
    }

    statements.push(this.buildGuardedAuditStatement(s.id, s.lastMutationId, cmd.newAudit));
    if (cmd.idempotency) {
      statements.push(
        this.buildGuardedIdempotencyStatement(s.id, s.lastMutationId, cmd.idempotency),
      );
    }

    let results: D1Result[];
    try {
      results = await this.d1.batch(statements);
    } catch (error) {
      if (isActiveDateCollisionError(error)) {
        throw new ConflictError(`Date ${s.postDate ?? ''} was modified concurrently`);
      }
      throw error;
    }

    if (cmd.displaced && (results[0]?.meta?.changes ?? 0) === 0) {
      throw new PreconditionFailedError(
        'The occupying slot changed before override could complete. Review and try again.',
      );
    }

    const [created, displaced] = await Promise.all([
      this.findById(s.id),
      cmd.displaced ? this.findById(cmd.displaced.id) : Promise.resolve(null),
    ]);
    if (!created) {
      throw new Error('Override batch did not persist new slot');
    }

    return { created, displaced };
  }

  async cancelSlotAtomic(cmd: CancelSlotAtomicCommand): Promise<PostSlotRow> {
    const updateStmt = this.d1
      .prepare(
        `UPDATE post_slots
         SET status = 'CANCELLED', post_date = NULL,
             version = version + 1, last_mutation_id = ?, updated_at = ?
         WHERE id = ? AND version = ? AND status != 'CANCELLED'`,
      )
      .bind(cmd.nextMutationId, cmd.nowIso, cmd.id, cmd.expectedVersion);

    return this.executeGuardedMutation(
      cmd.id,
      cmd.expectedVersion,
      cmd.nextMutationId,
      updateStmt,
      cmd.audit,
      cmd.idempotency,
    );
  }
}

export class InMemorySlotRepository implements ISlotRepository {
  private readonly orgUnitsMap = new Map<string, OrgUnit>();
  private readonly rows = new Map<string, PostSlotRow>();
  private readonly logs: SlotAuditLogRow[] = [];
  private readonly idemp = new Map<string, IdempotencyKeyRow>();

  constructor(seedOrgUnits: OrgUnit[] = [], seedSlots: PostSlotRow[] = []) {
    for (const unit of seedOrgUnits) {
      this.orgUnitsMap.set(unit.id, { ...unit });
    }
    for (const slot of seedSlots) {
      this.rows.set(slot.id, { ...slot });
    }
  }

  private idempKey(key: string, userId: string, route: string): string {
    return `${key}::${userId}::${route}`;
  }

  async listOrgUnits(): Promise<OrgUnit[]> {
    return [...this.orgUnitsMap.values()]
      .filter((u) => u.isActive)
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.code.localeCompare(b.code))
      .map((u) => ({ ...u }));
  }

  async findOrgUnitById(id: string): Promise<OrgUnit | null> {
    const unit = this.orgUnitsMap.get(id);
    return unit ? { ...unit } : null;
  }

  async findById(id: string): Promise<PostSlotRow | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async findBookedByDate(postDate: string): Promise<PostSlotRow | null> {
    for (const row of this.rows.values()) {
      if (row.status === 'BOOKED' && row.postDate === postDate) {
        return { ...row };
      }
    }
    return null;
  }

  async listBookedInRange(gridStart: string, gridEnd: string): Promise<PostSlotRow[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.status === 'BOOKED' &&
          row.postDate !== null &&
          row.postDate >= gridStart &&
          row.postDate <= gridEnd,
      )
      .sort((a, b) => (a.postDate ?? '').localeCompare(b.postDate ?? ''))
      .map((row) => ({ ...row }));
  }

  async listBookedDatesAfter(startDate: string, limit = 90): Promise<string[]> {
    return [...this.rows.values()]
      .filter(
        (row) => row.status === 'BOOKED' && row.postDate !== null && row.postDate >= startDate,
      )
      .map((row) => row.postDate as string)
      .sort()
      .slice(0, limit);
  }

  async listRelocationQueue(limit = 100): Promise<PostSlotRow[]> {
    return [...this.rows.values()]
      .filter((row) => row.status === 'PENDING_RELOCATION')
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .slice(0, limit)
      .map((row) => ({ ...row }));
  }

  async listAuditLogs(slotId: string): Promise<SlotAuditLogRow[]> {
    return this.logs
      .filter((log) => log.slotId === slotId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((log) => ({ ...log }));
  }

  async findIdempotencyRecord(
    key: string,
    userId: string,
    route: string,
    nowIso: string,
  ): Promise<IdempotencyKeyRow | null> {
    const rec = this.idemp.get(this.idempKey(key, userId, route));
    if (!rec || rec.expiresAt < nowIso) {
      return null;
    }
    return { ...rec };
  }

  async pruneExpiredIdempotencyKeys(nowIso: string, limit = 20): Promise<void> {
    let removed = 0;
    for (const [k, rec] of this.idemp.entries()) {
      if (rec.expiresAt < nowIso) {
        this.idemp.delete(k);
        removed += 1;
        if (removed >= limit) break;
      }
    }
  }

  private saveIdempotency(idemp?: IdempotencyRecordInput): void {
    if (!idemp) return;
    const record: NewIdempotencyKeyRow = { ...idemp };
    this.idemp.set(this.idempKey(idemp.key, idemp.userId, idemp.route), record);
  }

  async bookSlotAtomic(cmd: BookSlotAtomicCommand): Promise<PostSlotRow> {
    const s = cmd.slot;
    const record: PostSlotRow = {
      id: s.id,
      postDate: s.postDate ?? null,
      status: (s.status ?? 'BOOKED') as SlotStatus,
      orgUnitId: s.orgUnitId,
      contentType: s.contentType ?? 'POST',
      title: s.title,
      notes: s.notes ?? null,
      assetUrl: s.assetUrl ?? null,
      relocationReason: s.relocationReason ?? null,
      previousDate: s.previousDate ?? null,
      ownerSeatCode: s.ownerSeatCode,
      createdById: s.createdById,
      createdByName: s.createdByName,
      version: s.version ?? 1,
      lastMutationId: s.lastMutationId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };

    if (record.status === 'BOOKED' && record.postDate) {
      const collision = await this.findBookedByDate(record.postDate);
      if (collision) {
        throw new ConflictError(`Date ${record.postDate} is already booked`);
      }
    }

    this.rows.set(record.id, record);
    this.logs.push({ ...cmd.audit });
    this.saveIdempotency(cmd.idempotency);
    return { ...record };
  }

  private assertEditableRow(id: string, expectedVersion: number): PostSlotRow {
    const current = this.rows.get(id);
    if (!current || current.status === 'CANCELLED') {
      throw new NotFoundError('Content slot not found');
    }
    if (current.version !== expectedVersion) {
      throw new PreconditionFailedError(
        'This slot was updated by someone else. Review the latest state and try again.',
        { latest: { ...current } },
      );
    }
    return current;
  }

  async updateSlotAtomic(cmd: UpdateSlotAtomicCommand): Promise<PostSlotRow> {
    const current = this.assertEditableRow(cmd.id, cmd.expectedVersion);
    const updated: PostSlotRow = {
      ...current,
      ...cmd.patch,
      version: current.version + 1,
      lastMutationId: cmd.nextMutationId,
      updatedAt: cmd.nowIso,
    };
    this.rows.set(updated.id, updated);
    this.logs.push({ ...cmd.audit, slotId: updated.id });
    this.saveIdempotency(cmd.idempotency);
    return { ...updated };
  }

  async queueRelocationAtomic(cmd: QueueRelocationAtomicCommand): Promise<PostSlotRow> {
    const current = this.assertEditableRow(cmd.id, cmd.expectedVersion);
    if (current.status !== 'BOOKED') {
      throw new PreconditionFailedError('Only active booked slots can be queued for relocation', {
        latest: { ...current },
      });
    }
    const updated: PostSlotRow = {
      ...current,
      status: 'PENDING_RELOCATION',
      postDate: null,
      previousDate: cmd.previousDate,
      relocationReason: cmd.relocationReason,
      version: current.version + 1,
      lastMutationId: cmd.nextMutationId,
      updatedAt: cmd.nowIso,
    };
    this.rows.set(updated.id, updated);
    this.logs.push({ ...cmd.audit, slotId: updated.id });
    this.saveIdempotency(cmd.idempotency);
    return { ...updated };
  }

  async relocateSlotAtomic(cmd: RelocateSlotAtomicCommand): Promise<PostSlotRow> {
    const current = this.assertEditableRow(cmd.id, cmd.expectedVersion);
    const collision = await this.findBookedByDate(cmd.targetDate);
    if (collision && collision.id !== current.id) {
      throw new ConflictError(`Target date ${cmd.targetDate} is already booked`);
    }
    const updated: PostSlotRow = {
      ...current,
      status: 'BOOKED',
      postDate: cmd.targetDate,
      relocationReason: null,
      version: current.version + 1,
      lastMutationId: cmd.nextMutationId,
      updatedAt: cmd.nowIso,
    };
    this.rows.set(updated.id, updated);
    this.logs.push({ ...cmd.audit, slotId: updated.id });
    this.saveIdempotency(cmd.idempotency);
    return { ...updated };
  }

  async overrideSlotAtomic(cmd: OverrideSlotAtomicCommand): Promise<OverrideSlotAtomicResult> {
    let displacedRow: PostSlotRow | null = null;
    if (cmd.displaced) {
      const currentOccupant = this.rows.get(cmd.displaced.id);
      if (
        !currentOccupant ||
        currentOccupant.status !== 'BOOKED' ||
        currentOccupant.version !== cmd.displaced.expectedVersion
      ) {
        throw new PreconditionFailedError(
          'The occupying slot changed before override could complete. Review and try again.',
        );
      }
      displacedRow = {
        ...currentOccupant,
        status: 'PENDING_RELOCATION',
        postDate: null,
        previousDate: cmd.displaced.previousDate,
        relocationReason: cmd.displaced.relocationReason,
        version: currentOccupant.version + 1,
        lastMutationId: cmd.displaced.nextMutationId,
        updatedAt: cmd.nowIso,
      };
    }

    const s = cmd.newSlot;
    const newRecord: PostSlotRow = {
      id: s.id,
      postDate: s.postDate ?? null,
      status: (s.status ?? 'BOOKED') as SlotStatus,
      orgUnitId: s.orgUnitId,
      contentType: s.contentType ?? 'POST',
      title: s.title,
      notes: s.notes ?? null,
      assetUrl: s.assetUrl ?? null,
      relocationReason: null,
      previousDate: null,
      ownerSeatCode: s.ownerSeatCode,
      createdById: s.createdById,
      createdByName: s.createdByName,
      version: s.version ?? 1,
      lastMutationId: s.lastMutationId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };

    for (const row of this.rows.values()) {
      if (
        row.id !== displacedRow?.id &&
        row.status === 'BOOKED' &&
        row.postDate === newRecord.postDate
      ) {
        throw new ConflictError(`Date ${newRecord.postDate ?? ''} was modified concurrently`);
      }
    }

    if (displacedRow && cmd.displaced) {
      this.rows.set(displacedRow.id, displacedRow);
      this.logs.push({ ...cmd.displaced.audit, slotId: displacedRow.id });
    }
    this.rows.set(newRecord.id, newRecord);
    this.logs.push({ ...cmd.newAudit });
    this.saveIdempotency(cmd.idempotency);

    return {
      created: { ...newRecord },
      displaced: displacedRow ? { ...displacedRow } : null,
    };
  }

  async cancelSlotAtomic(cmd: CancelSlotAtomicCommand): Promise<PostSlotRow> {
    const current = this.assertEditableRow(cmd.id, cmd.expectedVersion);
    const updated: PostSlotRow = {
      ...current,
      status: 'CANCELLED',
      postDate: null,
      version: current.version + 1,
      lastMutationId: cmd.nextMutationId,
      updatedAt: cmd.nowIso,
    };
    this.rows.set(updated.id, updated);
    this.logs.push({ ...cmd.audit, slotId: updated.id });
    this.saveIdempotency(cmd.idempotency);
    return { ...updated };
  }
}
