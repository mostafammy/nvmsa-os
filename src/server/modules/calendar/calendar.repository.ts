import { and, asc, eq, gte, lte } from 'drizzle-orm';
import type { AppDatabase } from '../../core/db/client';
import { ConflictError } from '../../core/errors/domain-errors';
import { calendarSlots, type CalendarSlotRow, type NewCalendarSlotRow } from './calendar.table';

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
  update(id: string, patch: SlotUpdatePatch): Promise<CalendarSlotRow | null>;
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

  async update(id: string, patch: SlotUpdatePatch): Promise<CalendarSlotRow | null> {
    try {
      const [updated] = await this.db
        .update(calendarSlots)
        .set(patch)
        .where(eq(calendarSlots.id, id))
        .returning();
      return updated ?? null;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Target date ${patch.postDate ?? ''} is already booked`);
      }
      throw error;
    }
  }
}

/**
 * In-memory ISlotRepository enforcing the exact same partial unique index
 * (`post_date` unique while `status === 'booked'`) for fast Vitest unit tests.
 */
export class InMemorySlotRepository implements ISlotRepository {
  private readonly rows = new Map<string, CalendarSlotRow>();

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

  async update(id: string, patch: SlotUpdatePatch): Promise<CalendarSlotRow | null> {
    const current = this.rows.get(id);
    if (!current) return null;

    const next: CalendarSlotRow = {
      ...current,
      ...patch,
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
}
