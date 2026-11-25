import type {
  CalendarMonthResponse,
  CreateSlotInput,
  ManagedSlotView,
  PublicSlotView,
  RelocateSlotInput,
  SessionUser,
  SlotAuditLogEntry,
  UpdateSlotInput,
} from '@shared/types';
import { getMonthDateBounds, getTodayCairoDate, isValidIsoDate } from '@shared/utils';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../core/errors/domain-errors';
import { defaultCalendarPolicy, type CalendarPolicy } from './calendar.policy';
import type { ISlotRepository } from './calendar.repository';
import type { CalendarSlotAuditRow, CalendarSlotRow } from './calendar.table';

function toPublicSlotView(row: CalendarSlotRow): PublicSlotView {
  return {
    id: row.id,
    postDate: row.postDate,
    title: row.title,
    entityCode: row.entityCode,
    format: row.format,
    status: row.status,
    creatorName: row.creatorName,
  };
}

function toManagedSlotView(row: CalendarSlotRow): ManagedSlotView {
  return {
    ...toPublicSlotView(row),
    creatorId: row.creatorId,
    notes: row.notes,
    relocationReason: row.relocationReason,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAuditLogEntry(row: CalendarSlotAuditRow): SlotAuditLogEntry {
  return {
    id: row.id,
    slotId: row.slotId,
    action: row.action,
    actorId: row.actorId,
    actorName: row.actorName,
    actorRole: row.actorRole,
    previousDate: row.previousDate,
    nextDate: row.nextDate,
    reason: row.reason,
    createdAt: row.createdAt,
  };
}

export class CalendarService {
  constructor(
    private readonly repo: ISlotRepository,
    private readonly policy: CalendarPolicy = defaultCalendarPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private assertNotPastDateForRole(postDate: string, actor: SessionUser): void {
    const todayCairo = getTodayCairoDate(this.clock());
    if (postDate < todayCairo && !this.policy.canOverrideSlot(actor)) {
      throw new ValidationError(
        `Cannot book or reschedule onto a past Cairo date (${postDate} < ${todayCairo})`,
      );
    }
  }

  async listMonth(month: string, actor: SessionUser | null): Promise<CalendarMonthResponse> {
    const { start, end } = getMonthDateBounds(month);
    const bookedRows = await this.repo.listBookedInRange(start, end);
    const canViewManaged = this.policy.canViewManagedFields(actor);

    const slots = canViewManaged
      ? bookedRows.map(toManagedSlotView)
      : bookedRows.map(toPublicSlotView);

    const relocationQueue = canViewManaged
      ? (await this.repo.listRelocationQueue()).map(toManagedSlotView)
      : [];

    return {
      month,
      slots,
      relocationQueue,
    };
  }

  async listSlotHistory(id: string, actor: SessionUser | null): Promise<SlotAuditLogEntry[]> {
    if (!actor) {
      throw new UnauthorizedError('Sign in to view slot audit history');
    }
    if (!this.policy.canViewManagedFields(actor)) {
      throw new ForbiddenError('Only EB members and admins can view slot audit history');
    }
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Content slot not found');
    }
    const logs = await this.repo.listAuditLogs(id);
    return logs.map(toAuditLogEntry);
  }

  async bookSlot(input: CreateSlotInput, actor: SessionUser | null): Promise<ManagedSlotView> {
    if (!actor) {
      throw new UnauthorizedError('Sign in to book a content slot');
    }
    if (!this.policy.canBookSlot(actor)) {
      throw new ForbiddenError('Only EB members and admins can book calendar slots');
    }
    if (!isValidIsoDate(input.postDate)) {
      throw new ValidationError(`Invalid calendar date: ${input.postDate}`);
    }
    this.assertNotPastDateForRole(input.postDate, actor);

    const existing = await this.repo.findBookedByDate(input.postDate);
    if (existing) {
      throw new ConflictError(
        `Date ${input.postDate} is already booked by ${existing.entityCode} (${existing.title})`,
      );
    }

    const now = this.clock().toISOString();
    const created = await this.repo.insert({
      id: crypto.randomUUID(),
      postDate: input.postDate,
      title: input.title,
      entityCode: input.entityCode,
      format: input.format,
      status: 'booked',
      notes: input.notes ?? null,
      relocationReason: null,
      creatorId: actor.id,
      creatorName: actor.name,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await this.repo.appendAuditLog({
      id: crypto.randomUUID(),
      slotId: created.id,
      action: 'booked',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      previousDate: null,
      nextDate: created.postDate,
      reason: null,
      createdAt: now,
    });

    return toManagedSlotView(created);
  }

  async updateSlot(
    id: string,
    input: UpdateSlotInput,
    actor: SessionUser | null,
  ): Promise<ManagedSlotView> {
    if (!actor) {
      throw new UnauthorizedError('Sign in to edit a content slot');
    }

    const existing = await this.repo.findById(id);
    if (!existing || existing.status === 'cancelled') {
      throw new NotFoundError('Content slot not found');
    }

    if (!this.policy.canEditSlot(actor, existing)) {
      throw new ForbiddenError('Only the slot creator or an admin can edit this slot');
    }

    const now = this.clock().toISOString();
    const updated = await this.repo.update(
      id,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.entityCode !== undefined ? { entityCode: input.entityCode } : {}),
        ...(input.format !== undefined ? { format: input.format } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        updatedAt: now,
      },
      input.expectedVersion,
    );

    if (!updated) {
      throw new NotFoundError('Content slot not found');
    }

    await this.repo.appendAuditLog({
      id: crypto.randomUUID(),
      slotId: updated.id,
      action: 'updated',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      previousDate: existing.postDate,
      nextDate: updated.postDate,
      reason: null,
      createdAt: now,
    });

    return toManagedSlotView(updated);
  }

  async relocateSlot(
    id: string,
    input: RelocateSlotInput,
    actor: SessionUser | null,
  ): Promise<ManagedSlotView> {
    if (!actor) {
      throw new UnauthorizedError('Sign in to relocate a content slot');
    }

    const existing = await this.repo.findById(id);
    if (!existing || existing.status === 'cancelled') {
      throw new NotFoundError('Content slot not found');
    }

    if (!this.policy.canRelocateSlot(actor, existing)) {
      throw new ForbiddenError('Only the slot creator or an admin can relocate this slot');
    }

    const now = this.clock().toISOString();

    // Case 1: Move to Relocation Queue (frees the original post_date)
    if (!input.targetDate) {
      const queued = await this.repo.update(
        id,
        {
          status: 'relocation_queue',
          relocationReason: input.reason,
          updatedAt: now,
        },
        input.expectedVersion,
      );
      if (!queued) {
        throw new NotFoundError('Content slot not found');
      }

      await this.repo.appendAuditLog({
        id: crypto.randomUUID(),
        slotId: queued.id,
        action: 'queued_for_relocation',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        previousDate: existing.postDate,
        nextDate: null,
        reason: input.reason,
        createdAt: now,
      });

      return toManagedSlotView(queued);
    }

    // Case 2: Reschedule directly onto a specific targetDate
    if (!isValidIsoDate(input.targetDate)) {
      throw new ValidationError(`Invalid target date: ${input.targetDate}`);
    }
    this.assertNotPastDateForRole(input.targetDate, actor);

    const occupying = await this.repo.findBookedByDate(input.targetDate);
    if (occupying && occupying.id !== existing.id) {
      throw new ConflictError(
        `Target date ${input.targetDate} is already booked by ${occupying.entityCode}`,
      );
    }

    const relocated = await this.repo.update(
      id,
      {
        postDate: input.targetDate,
        status: 'booked',
        relocationReason: input.reason,
        updatedAt: now,
      },
      input.expectedVersion,
    );

    if (!relocated) {
      throw new NotFoundError('Content slot not found');
    }

    await this.repo.appendAuditLog({
      id: crypto.randomUUID(),
      slotId: relocated.id,
      action: 'relocated',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      previousDate: existing.postDate,
      nextDate: relocated.postDate,
      reason: input.reason,
      createdAt: now,
    });

    return toManagedSlotView(relocated);
  }

  async cancelSlot(id: string, actor: SessionUser | null): Promise<ManagedSlotView> {
    if (!actor) {
      throw new UnauthorizedError('Sign in to cancel a content slot');
    }

    const existing = await this.repo.findById(id);
    if (!existing || existing.status === 'cancelled') {
      throw new NotFoundError('Content slot not found');
    }

    if (!this.policy.canCancelSlot(actor, existing)) {
      throw new ForbiddenError('Only the slot creator or an admin can cancel this slot');
    }

    const now = this.clock().toISOString();
    const cancelled = await this.repo.update(id, {
      status: 'cancelled',
      updatedAt: now,
    });

    if (!cancelled) {
      throw new NotFoundError('Content slot not found');
    }

    await this.repo.appendAuditLog({
      id: crypto.randomUUID(),
      slotId: cancelled.id,
      action: 'cancelled',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      previousDate: existing.postDate,
      nextDate: null,
      reason: null,
      createdAt: now,
    });

    return toManagedSlotView(cancelled);
  }
}
