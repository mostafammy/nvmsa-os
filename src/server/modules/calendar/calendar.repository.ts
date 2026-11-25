import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { AppDatabase } from '../../core/db/client';
import { ConflictError } from '../../core/errors/domain-errors';
import {
  calendarSlotAuditLogs,
  calendarSlots,
  type CalendarSlotAuditRow,
  type CalendarSlotRow,
  type NewCalendarSlotAuditRow,
  type NewCalendarSlotRow,
} from './calendar.table';

export type SlotUpdatePatch = Partial<
  Pick<
    CalendarSlotRow,
    'postDate' | 'title' | 'entityCode' | 'format' | 'status' | 'notes' | 'relocationReason' | 'updatedAt'
  >
>;

export interface ISlotRepository {
  findById(id: string): Promise<CalendarSlotRow | null>;
  findBookedByDate(postDate: string): Promise<CalendarSlotRow | null>;
  listBookedInRange(startDate: string, endDate: string): Promise<CalendarSlotRow[]>;
  listRelocationQueue(): Promise<CalendarSlotRow[]>;
  insert(slot: NewCalendarSlotRow): Promise<CalendarSlotRow>;
  update(id: string, patch: SlotUpdatePatch, expectedVersion?: number): Promise<CalendarSlotRow | null>;
  appendAuditLog(entry: NewCalendarSlotAuditRow): Promise<CalendarSlotAuditRow>;
  listAuditLogs(slotId: string): Promise<CalendarSlotAuditRow[]>;
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('unique constraint failed') ||
    message.includes('sqlite_constraint_unique') ||
    message.includes('calendar_slots_booked_date_uidx')
  );
}

export class D1SlotRepository implements ISlotRepository {
  constructor(private readonly db: AppDatabase) {}

  async findById(id: string): Promise<CalendarSlotRow | null> {
    const [row] = await this.db
      .select()
      .from(calendarSlots)
      .where(eq(calendarSlots.id, id))
      .limit(1);
    return row ?? null;
  }

  async findBookedByDate(postDate: string): Promise<CalendarSlotRow | null> {
    const [row] = await this.db
      .select()
      .from(calendarSlots)
      .where(and(eq(calendarSlots.postDate, postDate), eq(calendarSlots.status, 'booked')))
      .limit(1);
    return row ?? null;
  }

  async listBookedInRange(startDate: string, endDate: string): Promise<CalendarSlotRow[]> {
    return this.db
      .select()
      .from(calendarSlots)
      .where(
        and(
          eq(calendarSlots.status, 'booked'),
          gte(calendarSlots.postDate, startDate),
          lte(calendarSlots.postDate, endDate),
        ),
      )
      .orderBy(asc(calendarSlots.postDate));
  }

  async listRelocationQueue(): Promise<CalendarSlotRow[]> {
    return this.db
      .select()
      .from(calendarSlots)
      .where(eq(calendarSlots.status, 'relocation_queue'))
      .orderBy(asc(calendarSlots.updatedAt));
  }

  async insert(slot: NewCalendarSlotRow): Promise<CalendarSlotRow> {
    try {
      const [inserted] = await this.db.insert(calendarSlots).values(slot).returning();
      if (!inserted) {
        throw new Error('Failed to insert calendar slot');
      }
      return inserted;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Date ${slot.postDate} is already booked`);
      }
      throw error;
    }
  }

  async update(
    id: string,
    patch: SlotUpdatePatch,
    expectedVersion?: number,
  ): Promise<CalendarSlotRow | null> {
    try {
      const whereClause =
        expectedVersion !== undefined
          ? and(eq(calendarSlots.id, id), eq(calendarSlots.version, expectedVersion))
          : eq(calendarSlots.id, id);

      const [updated] = await this.db
        .update(calendarSlots)
        .set({
          ...patch,
          version: sql`${calendarSlots.version} + 1`,
        })
        .where(whereClause)
        .returning();

      if (!updated && expectedVersion !== undefined) {
        const current = await this.findById(id);
        if (current) {
          throw new ConflictError(
            'This slot was modified by someone else. Refresh and try again.',
          );
        }
      }

      return updated ?? null;
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Target date ${patch.postDate ?? ''} is already booked`);
      }
      throw error;
    }
  }

  async appendAuditLog(entry: NewCalendarSlotAuditRow): Promise<CalendarSlotAuditRow> {
    const [inserted] = await this.db.insert(calendarSlotAuditLogs).values(entry).returning();
    if (!inserted) {
      throw new Error('Failed to append calendar audit log');
    }
    return inserted;
  }

  async listAuditLogs(slotId: string): Promise<CalendarSlotAuditRow[]> {
    return this.db
      .select()
      .from(calendarSlotAuditLogs)
      .where(eq(calendarSlotAuditLogs.slotId, slotId))
      .orderBy(desc(calendarSlotAuditLogs.createdAt));
  }
}

/**
 * In-memory ISlotRepository enforcing the partial unique index,
 * optimistic locking (`version`), and append-only audit logs for fast unit tests.
 */
export class InMemorySlotRepository implements ISlotRepository {
  private readonly rows = new Map<string, CalendarSlotRow>();
  private readonly logs: CalendarSlotAuditRow[] = [];

  constructor(seed: CalendarSlotRow[] = []) {
    for (const row of seed) {
      this.rows.set(row.id, { ...row });
    }
  }

  async findById(id: string): Promise<CalendarSlotRow | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async findBookedByDate(postDate: string): Promise<CalendarSlotRow | null> {
    for (const row of this.rows.values()) {
      if (row.status === 'booked' && row.postDate === postDate) {
        return { ...row };
      }
    }
    return null;
  }

  async listBookedInRange(startDate: string, endDate: string): Promise<CalendarSlotRow[]> {
    return [...this.rows.values()]
      .filter((row) => row.status === 'booked' && row.postDate >= startDate && row.postDate <= endDate)
      .sort((a, b) => a.postDate.localeCompare(b.postDate))
      .map((row) => ({ ...row }));
  }

  async listRelocationQueue(): Promise<CalendarSlotRow[]> {
    return [...this.rows.values()]
      .filter((row) => row.status === 'relocation_queue')
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .map((row) => ({ ...row }));
  }

  async insert(slot: NewCalendarSlotRow): Promise<CalendarSlotRow> {
    const record: CalendarSlotRow = {
      id: slot.id,
      postDate: slot.postDate,
      title: slot.title,
      entityCode: slot.entityCode,
      format: slot.format ?? 'poster',
      status: slot.status ?? 'booked',
      notes: slot.notes ?? null,
      relocationReason: slot.relocationReason ?? null,
      creatorId: slot.creatorId,
      creatorName: slot.creatorName,
      version: slot.version ?? 1,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };

    if (record.status === 'booked') {
      const existing = await this.findBookedByDate(record.postDate);
      if (existing) {
        throw new ConflictError(`Date ${record.postDate} is already booked`);
      }
    }

    this.rows.set(record.id, record);
    return { ...record };
  }

  async update(
    id: string,
    patch: SlotUpdatePatch,
    expectedVersion?: number,
  ): Promise<CalendarSlotRow | null> {
    const current = this.rows.get(id);
    if (!current) return null;

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConflictError('This slot was modified by someone else. Refresh and try again.');
    }

    const next: CalendarSlotRow = {
      ...current,
      ...patch,
      version: current.version + 1,
    };

    if (next.status === 'booked') {
      for (const row of this.rows.values()) {
        if (row.id !== id && row.status === 'booked' && row.postDate === next.postDate) {
          throw new ConflictError(`Target date ${next.postDate} is already booked`);
        }
      }
    }

    this.rows.set(id, next);
    return { ...next };
  }

  async appendAuditLog(entry: NewCalendarSlotAuditRow): Promise<CalendarSlotAuditRow> {
    const record: CalendarSlotAuditRow = {
      id: entry.id,
      slotId: entry.slotId,
      action: entry.action,
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      previousDate: entry.previousDate ?? null,
      nextDate: entry.nextDate ?? null,
      reason: entry.reason ?? null,
      createdAt: entry.createdAt,
    };
    this.logs.push(record);
    return { ...record };
  }

  async listAuditLogs(slotId: string): Promise<CalendarSlotAuditRow[]> {
    return this.logs
      .filter((log) => log.slotId === slotId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((log) => ({ ...log }));
  }
}
