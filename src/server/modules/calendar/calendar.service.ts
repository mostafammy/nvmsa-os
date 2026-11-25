import type {
  CalendarMonthResponse,
  CreateSlotInput,
  ManagedSlotView,
  PublicSlotView,
  RelocateSlotInput,
  SessionUser,
  UpdateSlotInput,
} from '@shared/types';
import { getMonthDateBounds, isValidIsoDate } from '@shared/utils';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../core/errors/domain-errors';
import { defaultCalendarPolicy, type CalendarPolicy } from './calendar.policy';
import type { ISlotRepository } from './calendar.repository';
import type { CalendarSlotRow } from './calendar.table';

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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CalendarService {
  constructor(
    private readonly repo: ISlotRepository,
    private readonly policy: CalendarPolicy = defaultCalendarPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

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
      createdAt: now,
      updatedAt: now,
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

    const updated = await this.repo.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.entityCode !== undefined ? { entityCode: input.entityCode } : {}),
      ...(input.format !== undefined ? { format: input.format } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedAt: this.clock().toISOString(),
    });

    if (!updated) {
      throw new NotFoundError('Content slot not found');
    }

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
      const queued = await this.repo.update(id, {
        status: 'relocation_queue',
        relocationReason: input.reason,
        updatedAt: now,
      });
      if (!queued) {
        throw new NotFoundError('Content slot not found');
      }
      return toManagedSlotView(queued);
    }

    // Case 2: Reschedule directly onto a specific targetDate
    if (!isValidIsoDate(input.targetDate)) {
      throw new ValidationError(`Invalid target date: ${input.targetDate}`);
    }

    const occupying = await this.repo.findBookedByDate(input.targetDate);
    if (occupying && occupying.id !== existing.id) {
      throw new ConflictError(
        `Target date ${input.targetDate} is already booked by ${occupying.entityCode}`,
      );
    }

    const relocated = await this.repo.update(id, {
      postDate: input.targetDate,
      status: 'booked',
      relocationReason: input.reason,
      updatedAt: now,
    });

    if (!relocated) {
      throw new NotFoundError('Content slot not found');
    }

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

    const cancelled = await this.repo.update(id, {
      status: 'cancelled',
      updatedAt: this.clock().toISOString(),
    });

    if (!cancelled) {
      throw new NotFoundError('Content slot not found');
    }

    return toManagedSlotView(cancelled);
  }
}
