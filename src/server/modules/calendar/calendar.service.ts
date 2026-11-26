import {
  MASKED_SUPER_ADMIN_LABEL,
  MASKED_SUPER_ADMIN_ROLE,
  SUPER_ADMIN_SEAT_CODE,
} from '@shared/constants';
import type {
  BookSlotInput,
  CancelSlotInput,
  ConflictWinnerPayload,
  ManagedSlotView,
  MonthScheduleResponse,
  OverrideSlotInput,
  OverrideSlotResponse,
  PublicSlotView,
  QueueRelocationInput,
  RelocateSlotInput,
  SeatSessionUser,
  SlotAuditLogEntry,
  SlotMutationResponse,
  UpdateSlotInput,
} from '@shared/types';
import {
  addDaysIsoDate,
  getGridDateBounds,
  getTodayCairoDate,
  isValidIsoDate,
  isValidYearMonth,
} from '@shared/utils';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
  UnauthorizedError,
  UnprocessableEntityError,
  ValidationError,
} from '../../core/errors/domain-errors';
import { defaultCalendarPolicy, type CalendarPolicy } from './calendar.policy';
import type { IdempotencyRecordInput, ISlotRepository } from './calendar.repository';
import type { PostSlotRow, SlotAuditLogRow } from './calendar.table';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export interface MutationContext {
  requestId: string;
  idempotencyKey?: string;
  routeKey: string;
  scheduleBackground?: (promise: Promise<unknown>) => void;
}

export interface IdempotentReplayResult<T> {
  replayed: true;
  statusCode: number;
  body: T;
}

export function isSuperAdminMasked(
  viewer: SeatSessionUser | null,
  ownerSeatCode: string,
): boolean {
  return ownerSeatCode === SUPER_ADMIN_SEAT_CODE && viewer?.capabilities.canSeeSuperAdmin !== true;
}

export function projectPublicSlot(
  row: PostSlotRow,
  viewer: SeatSessionUser | null,
): PublicSlotView {
  const masked = isSuperAdminMasked(viewer, row.ownerSeatCode);
  return {
    id: row.id,
    postDate: row.postDate,
    status: row.status,
    orgUnitId: row.orgUnitId,
    contentType: row.contentType,
    title: row.title,
    assetUrl: row.assetUrl,
    ownerSeatCode: masked ? MASKED_SUPER_ADMIN_ROLE : row.ownerSeatCode,
    creatorName: masked ? MASKED_SUPER_ADMIN_LABEL : row.createdByName,
    version: row.version,
    updatedAt: row.updatedAt,
  };
}

export function projectManagedSlot(
  row: PostSlotRow,
  viewer: SeatSessionUser | null,
): ManagedSlotView {
  const masked = isSuperAdminMasked(viewer, row.ownerSeatCode);
  return {
    ...projectPublicSlot(row, viewer),
    createdById: masked ? null : row.createdById,
    notes: row.notes,
    relocationReason: row.relocationReason,
    previousDate: row.previousDate,
    createdAt: row.createdAt,
  };
}

export function projectAuditEntry(
  row: SlotAuditLogRow,
  viewer: SeatSessionUser | null,
): SlotAuditLogEntry {
  const masked = row.actorRole === 'super_admin' && viewer?.capabilities.canSeeSuperAdmin !== true;
  return {
    id: row.id,
    slotId: row.slotId,
    action: row.action,
    actorId: masked ? null : row.actorId,
    actorName: masked ? MASKED_SUPER_ADMIN_LABEL : row.actorName,
    actorRole: masked ? MASKED_SUPER_ADMIN_ROLE : row.actorRole,
    diffJson: row.diffJson,
    requestId: row.requestId,
    createdAt: row.createdAt,
  };
}

function collectAffectedMonths(dates: Array<string | null | undefined>): string[] {
  const months = new Set<string>();
  for (const iso of dates) {
    if (iso && iso.length >= 7) {
      months.add(iso.slice(0, 7));
    }
  }
  return [...months].sort();
}

async function computeRequestHash(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class CalendarService {
  constructor(
    private readonly repo: ISlotRepository,
    private readonly policy: CalendarPolicy = defaultCalendarPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private assertAuthenticatedSeat(actor: SeatSessionUser | null, action: string): SeatSessionUser {
    if (!actor) {
      throw new UnauthorizedError(`Sign in to ${action}`);
    }
    return actor;
  }

  private assertReasonIfSuperAdmin(actor: SeatSessionUser, reason?: string): void {
    if (this.policy.requiresSuperAdminReason(actor) && (!reason || reason.trim().length < 3)) {
      throw new ValidationError('A reason (at least 3 characters) is required for super_admin actions');
    }
  }

  private assertNotPastDate(isoDate: string, actor: SeatSessionUser): void {
    const todayCairo = getTodayCairoDate(this.clock());
    if (isoDate < todayCairo && !this.policy.canBackfillPastDates(actor)) {
      throw new ValidationError(
        `Cannot book or move onto a past Cairo date (${isoDate} < ${todayCairo})`,
      );
    }
  }

  private async assertValidActiveOrgUnit(actor: SeatSessionUser, orgUnitId: string): Promise<void> {
    if (!this.policy.canBookForOrgUnit(actor, orgUnitId)) {
      throw new ForbiddenError(`Seat ${actor.seatCode} cannot schedule posts for ${orgUnitId}`);
    }
    const unit = await this.repo.findOrgUnitById(orgUnitId);
    if (!unit || !unit.isActive) {
      throw new ValidationError(`Organization unit "${orgUnitId}" is invalid or inactive`);
    }
  }

  private async checkIdempotency<T>(
    ctx: MutationContext | undefined,
    actor: SeatSessionUser,
    requestHash: string,
  ): Promise<IdempotentReplayResult<T> | null> {
    if (!ctx?.idempotencyKey) return null;
    const nowIso = this.clock().toISOString();
    ctx.scheduleBackground?.(this.repo.pruneExpiredIdempotencyKeys(nowIso, 20));

    const existing = await this.repo.findIdempotencyRecord(
      ctx.idempotencyKey,
      actor.id,
      ctx.routeKey,
      nowIso,
    );
    if (!existing) return null;

    if (existing.requestHash !== requestHash) {
      throw new UnprocessableEntityError(
        'Idempotency-Key was reused with a different request payload',
      );
    }

    return {
      replayed: true,
      statusCode: existing.responseCode,
      body: JSON.parse(existing.responseBody) as T,
    };
  }

  private buildIdempotencyInput(
    ctx: MutationContext | undefined,
    actor: SeatSessionUser,
    requestHash: string,
    responseCode: number,
    responseBody: unknown,
    now: Date,
  ): IdempotencyRecordInput | undefined {
    if (!ctx?.idempotencyKey) return undefined;
    return {
      key: ctx.idempotencyKey,
      userId: actor.id,
      route: ctx.routeKey,
      requestHash,
      responseCode,
      responseBody: JSON.stringify(responseBody),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_MS).toISOString(),
    };
  }

  private async findNextOpenDate(afterDate: string): Promise<string | null> {
    const nextDay = addDaysIsoDate(afterDate, 1);
    const booked = new Set(await this.repo.listBookedDatesAfter(nextDay, 60));
    for (let offset = 1; offset <= 60; offset += 1) {
      const candidate = addDaysIsoDate(afterDate, offset);
      if (!booked.has(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private async throwDateConflictWithWinner(
    targetDate: string,
    viewer: SeatSessionUser | null,
    occupant?: PostSlotRow | null,
  ): Promise<never> {
    const resolvedOccupant = occupant ?? (await this.repo.findBookedByDate(targetDate));
    if (!resolvedOccupant) {
      throw new ConflictError(`Date ${targetDate} is already booked`);
    }
    const nextOpenDate = await this.findNextOpenDate(targetDate);
    const payload: ConflictWinnerPayload = {
      winner: projectPublicSlot(resolvedOccupant, viewer),
      nextOpenDate,
    };
    throw new ConflictError(
      `Date ${targetDate} is already booked by ${resolvedOccupant.orgUnitId} (${resolvedOccupant.title})`,
      payload,
    );
  }

  async listMonth(month: string, viewer: SeatSessionUser | null): Promise<MonthScheduleResponse> {
    if (!isValidYearMonth(month)) {
      throw new ValidationError(`Invalid month format: ${month}`);
    }
    const { gridStart, gridEnd } = getGridDateBounds(month);
    const [orgUnits, bookedRows] = await Promise.all([
      this.repo.listOrgUnits(),
      this.repo.listBookedInRange(gridStart, gridEnd),
    ]);

    const canViewManaged = this.policy.canViewManagedFields(viewer);
    const slots = canViewManaged
      ? bookedRows.map((row) => projectManagedSlot(row, viewer))
      : bookedRows.map((row) => projectPublicSlot(row, viewer));

    return {
      month,
      gridStart,
      gridEnd,
      serverTodayCairo: getTodayCairoDate(this.clock()),
      orgUnits,
      slots,
    };
  }

  async listRelocations(viewer: SeatSessionUser | null): Promise<ManagedSlotView[]> {
    this.assertAuthenticatedSeat(viewer, 'view the relocation queue');
    const rows = await this.repo.listRelocationQueue(100);
    return rows.map((row) => projectManagedSlot(row, viewer));
  }

  async listSlotHistory(id: string, viewer: SeatSessionUser | null): Promise<SlotAuditLogEntry[]> {
    this.assertAuthenticatedSeat(viewer, 'view slot audit history');
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Content slot not found');
    }
    const logs = await this.repo.listAuditLogs(id);
    return logs.map((row) => projectAuditEntry(row, viewer));
  }

  async bookSlot(
    input: BookSlotInput,
    actor: SeatSessionUser | null,
    ctx?: MutationContext,
  ): Promise<SlotMutationResponse | IdempotentReplayResult<SlotMutationResponse>> {
    const validActor = this.assertAuthenticatedSeat(actor, 'book a content slot');
    this.assertReasonIfSuperAdmin(validActor, input.reason);

    if (!isValidIsoDate(input.postDate)) {
      throw new ValidationError(`Invalid calendar date: ${input.postDate}`);
    }
    await this.assertValidActiveOrgUnit(validActor, input.orgUnitId);
    this.assertNotPastDate(input.postDate, validActor);

    const requestHash = await computeRequestHash(input);
    const replay = await this.checkIdempotency<SlotMutationResponse>(ctx, validActor, requestHash);
    if (replay) return replay;

    const existingOccupant = await this.repo.findBookedByDate(input.postDate);
    if (existingOccupant) {
      await this.throwDateConflictWithWinner(input.postDate, validActor, existingOccupant);
    }

    const now = this.clock();
    const nowIso = now.toISOString();
    const slotId = crypto.randomUUID();
    const mutationId = crypto.randomUUID();

    const predictedRow: PostSlotRow = {
      id: slotId,
      postDate: input.postDate,
      status: 'BOOKED',
      orgUnitId: input.orgUnitId,
      contentType: input.contentType,
      title: input.title,
      notes: input.notes ?? null,
      assetUrl: input.assetUrl ?? null,
      relocationReason: null,
      previousDate: null,
      ownerSeatCode: validActor.seatCode,
      createdById: validActor.id,
      createdByName: validActor.name,
      version: 1,
      lastMutationId: mutationId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const response: SlotMutationResponse = {
      slot: projectManagedSlot(predictedRow, validActor),
      affectedMonths: collectAffectedMonths([input.postDate]),
    };

    try {
      const committed = await this.repo.bookSlotAtomic({
        slot: predictedRow,
        audit: {
          id: crypto.randomUUID(),
          slotId,
          actorId: validActor.id,
          actorName: validActor.name,
          actorRole: validActor.tier,
          action: 'BOOKED',
          diffJson: JSON.stringify({
            postDate: input.postDate,
            orgUnitId: input.orgUnitId,
            title: input.title,
            reason: input.reason ?? null,
          }),
          requestId: ctx?.requestId ?? 'unknown',
          createdAt: nowIso,
        },
        idempotency: this.buildIdempotencyInput(ctx, validActor, requestHash, 201, response, now),
      });

      return {
        slot: projectManagedSlot(committed, validActor),
        affectedMonths: response.affectedMonths,
      };
    } catch (error) {
      if (error instanceof ConflictError) {
        await this.throwDateConflictWithWinner(input.postDate, validActor);
      }
      throw error;
    }
  }

  async updateSlot(
    id: string,
    input: UpdateSlotInput,
    actor: SeatSessionUser | null,
    ctx?: MutationContext,
  ): Promise<SlotMutationResponse | IdempotentReplayResult<SlotMutationResponse>> {
    const validActor = this.assertAuthenticatedSeat(actor, 'edit a content slot');
    this.assertReasonIfSuperAdmin(validActor, input.reason);

    const requestHash = await computeRequestHash({ id, ...input });
    const replay = await this.checkIdempotency<SlotMutationResponse>(ctx, validActor, requestHash);
    if (replay) return replay;

    const existing = await this.repo.findById(id);
    if (!existing || existing.status === 'CANCELLED') {
      throw new NotFoundError('Content slot not found');
    }
    if (!this.policy.canMutateSlot(validActor, existing)) {
      throw new ForbiddenError('Only the owning seat or an authorized lead can edit this slot');
    }

    const nextOrgUnitId = input.orgUnitId ?? existing.orgUnitId;
    if (input.orgUnitId !== undefined) {
      await this.assertValidActiveOrgUnit(validActor, nextOrgUnitId);
    }

    const now = this.clock();
    const nowIso = now.toISOString();
    const mutationId = crypto.randomUUID();
    const patch = {
      orgUnitId: nextOrgUnitId,
      contentType: input.contentType ?? existing.contentType,
      title: input.title ?? existing.title,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      assetUrl: input.assetUrl !== undefined ? input.assetUrl : existing.assetUrl,
    };

    const predictedRow: PostSlotRow = {
      ...existing,
      ...patch,
      version: input.expectedVersion + 1,
      lastMutationId: mutationId,
      updatedAt: nowIso,
    };
    const affectedMonths = collectAffectedMonths([existing.postDate]);
    const predictedResponse: SlotMutationResponse = {
      slot: projectManagedSlot(predictedRow, validActor),
      affectedMonths,
    };

    try {
      const committed = await this.repo.updateSlotAtomic({
        id,
        expectedVersion: input.expectedVersion,
        nextMutationId: mutationId,
        patch,
        nowIso,
        audit: {
          id: crypto.randomUUID(),
          actorId: validActor.id,
          actorName: validActor.name,
          actorRole: validActor.tier,
          action: 'UPDATED',
          diffJson: JSON.stringify({
            before: {
              orgUnitId: existing.orgUnitId,
              contentType: existing.contentType,
              title: existing.title,
              notes: existing.notes,
              assetUrl: existing.assetUrl,
            },
            after: patch,
            reason: input.reason ?? null,
          }),
          requestId: ctx?.requestId ?? 'unknown',
          createdAt: nowIso,
        },
        idempotency: this.buildIdempotencyInput(
          ctx,
          validActor,
          requestHash,
          200,
          predictedResponse,
          now,
        ),
      });

      return {
        slot: projectManagedSlot(committed, validActor),
        affectedMonths,
      };
    } catch (error) {
      if (error instanceof PreconditionFailedError && error.details && typeof error.details === 'object') {
        const latest = (error.details as { latest?: PostSlotRow }).latest;
        if (latest) {
          throw new PreconditionFailedError(error.message, {
            latest: projectManagedSlot(latest, validActor),
          });
        }
      }
      throw error;
    }
  }

  async queueRelocation(
    id: string,
    input: QueueRelocationInput,
    actor: SeatSessionUser | null,
    ctx?: MutationContext,
  ): Promise<SlotMutationResponse | IdempotentReplayResult<SlotMutationResponse>> {
    const validActor = this.assertAuthenticatedSeat(actor, 'queue a slot for relocation');
    this.assertReasonIfSuperAdmin(validActor, input.reason);

    const requestHash = await computeRequestHash({ id, ...input });
    const replay = await this.checkIdempotency<SlotMutationResponse>(ctx, validActor, requestHash);
    if (replay) return replay;

    const existing = await this.repo.findById(id);
    if (!existing || existing.status === 'CANCELLED') {
      throw new NotFoundError('Content slot not found');
    }
    if (!this.policy.canMutateSlot(validActor, existing)) {
      throw new ForbiddenError('Only the owning seat or an authorized lead can move this slot');
    }
    if (existing.status !== 'BOOKED' || !existing.postDate) {
      throw new ValidationError('Slot is already in the Pending Relocation queue');
    }

    const now = this.clock();
    const nowIso = now.toISOString();
    const mutationId = crypto.randomUUID();
    const affectedMonths = collectAffectedMonths([existing.postDate]);
    const predictedRow: PostSlotRow = {
      ...existing,
      status: 'PENDING_RELOCATION',
      postDate: null,
      previousDate: existing.postDate,
      relocationReason: input.relocationReason,
      version: input.expectedVersion + 1,
      lastMutationId: mutationId,
      updatedAt: nowIso,
    };
    const predictedResponse: SlotMutationResponse = {
      slot: projectManagedSlot(predictedRow, validActor),
      affectedMonths,
    };

    try {
      const committed = await this.repo.queueRelocationAtomic({
        id,
        expectedVersion: input.expectedVersion,
        nextMutationId: mutationId,
        previousDate: existing.postDate,
        relocationReason: input.relocationReason,
        nowIso,
        audit: {
          id: crypto.randomUUID(),
          actorId: validActor.id,
          actorName: validActor.name,
          actorRole: validActor.tier,
          action: 'QUEUED_RELOCATION',
          diffJson: JSON.stringify({
            previousDate: existing.postDate,
            relocationReason: input.relocationReason,
            reason: input.reason ?? null,
          }),
          requestId: ctx?.requestId ?? 'unknown',
          createdAt: nowIso,
        },
        idempotency: this.buildIdempotencyInput(
          ctx,
          validActor,
          requestHash,
          200,
          predictedResponse,
          now,
        ),
      });

      return {
        slot: projectManagedSlot(committed, validActor),
        affectedMonths,
      };
    } catch (error) {
      if (error instanceof PreconditionFailedError && error.details && typeof error.details === 'object') {
        const latest = (error.details as { latest?: PostSlotRow }).latest;
        if (latest) {
          throw new PreconditionFailedError(error.message, {
            latest: projectManagedSlot(latest, validActor),
          });
        }
      }
      throw error;
    }
  }

  async relocateSlot(
    id: string,
    input: RelocateSlotInput,
    actor: SeatSessionUser | null,
    ctx?: MutationContext,
  ): Promise<SlotMutationResponse | IdempotentReplayResult<SlotMutationResponse>> {
    const validActor = this.assertAuthenticatedSeat(actor, 'relocate a content slot');
    this.assertReasonIfSuperAdmin(validActor, input.reason);

    if (!isValidIsoDate(input.targetDate)) {
      throw new ValidationError(`Invalid target date: ${input.targetDate}`);
    }
    this.assertNotPastDate(input.targetDate, validActor);

    const requestHash = await computeRequestHash({ id, ...input });
    const replay = await this.checkIdempotency<SlotMutationResponse>(ctx, validActor, requestHash);
    if (replay) return replay;

    const existing = await this.repo.findById(id);
    if (!existing || existing.status === 'CANCELLED') {
      throw new NotFoundError('Content slot not found');
    }
    if (!this.policy.canMutateSlot(validActor, existing)) {
      throw new ForbiddenError('Only the owning seat or an authorized lead can relocate this slot');
    }

    const occupant = await this.repo.findBookedByDate(input.targetDate);
    if (occupant && occupant.id !== existing.id) {
      await this.throwDateConflictWithWinner(input.targetDate, validActor, occupant);
    }

    const now = this.clock();
    const nowIso = now.toISOString();
    const mutationId = crypto.randomUUID();
    const affectedMonths = collectAffectedMonths([existing.postDate, input.targetDate]);
    const predictedRow: PostSlotRow = {
      ...existing,
      status: 'BOOKED',
      postDate: input.targetDate,
      relocationReason: null,
      version: input.expectedVersion + 1,
      lastMutationId: mutationId,
      updatedAt: nowIso,
    };
    const predictedResponse: SlotMutationResponse = {
      slot: projectManagedSlot(predictedRow, validActor),
      affectedMonths,
    };

    try {
      const committed = await this.repo.relocateSlotAtomic({
        id,
        expectedVersion: input.expectedVersion,
        nextMutationId: mutationId,
        targetDate: input.targetDate,
        nowIso,
        audit: {
          id: crypto.randomUUID(),
          actorId: validActor.id,
          actorName: validActor.name,
          actorRole: validActor.tier,
          action: 'RELOCATED',
          diffJson: JSON.stringify({
            fromDate: existing.postDate ?? existing.previousDate,
            toDate: input.targetDate,
            reason: input.reason ?? null,
          }),
          requestId: ctx?.requestId ?? 'unknown',
          createdAt: nowIso,
        },
        idempotency: this.buildIdempotencyInput(
          ctx,
          validActor,
          requestHash,
          200,
          predictedResponse,
          now,
        ),
      });

      return {
        slot: projectManagedSlot(committed, validActor),
        affectedMonths,
      };
    } catch (error) {
      if (error instanceof ConflictError) {
        await this.throwDateConflictWithWinner(input.targetDate, validActor);
      }
      if (error instanceof PreconditionFailedError && error.details && typeof error.details === 'object') {
        const latest = (error.details as { latest?: PostSlotRow }).latest;
        if (latest) {
          throw new PreconditionFailedError(error.message, {
            latest: projectManagedSlot(latest, validActor),
          });
        }
      }
      throw error;
    }
  }

  async overrideSlot(
    input: OverrideSlotInput,
    actor: SeatSessionUser | null,
    ctx?: MutationContext,
  ): Promise<OverrideSlotResponse | IdempotentReplayResult<OverrideSlotResponse>> {
    const validActor = this.assertAuthenticatedSeat(actor, 'override a content slot');
    if (!this.policy.canOverrideSlot(validActor)) {
      throw new ForbiddenError('Only Executive Board, President, or PNSDD can override slots');
    }
    if (!isValidIsoDate(input.postDate)) {
      throw new ValidationError(`Invalid calendar date: ${input.postDate}`);
    }
    await this.assertValidActiveOrgUnit(validActor, input.orgUnitId);
    this.assertNotPastDate(input.postDate, validActor);

    const requestHash = await computeRequestHash(input);
    const replay = await this.checkIdempotency<OverrideSlotResponse>(ctx, validActor, requestHash);
    if (replay) return replay;

    const occupant = await this.repo.findBookedByDate(input.postDate);
    if (
      occupant &&
      input.expectedOccupantVersion !== undefined &&
      occupant.version !== input.expectedOccupantVersion
    ) {
      throw new PreconditionFailedError(
        'The occupying slot changed before override could run. Review and try again.',
        { latest: projectManagedSlot(occupant, validActor) },
      );
    }

    const now = this.clock();
    const nowIso = now.toISOString();
    const slotId = crypto.randomUUID();
    const newMutationId = crypto.randomUUID();
    const affectedMonths = collectAffectedMonths([input.postDate]);

    const newRow: PostSlotRow = {
      id: slotId,
      postDate: input.postDate,
      status: 'BOOKED',
      orgUnitId: input.orgUnitId,
      contentType: input.contentType,
      title: input.title,
      notes: input.notes ?? null,
      assetUrl: input.assetUrl ?? null,
      relocationReason: null,
      previousDate: null,
      ownerSeatCode: validActor.seatCode,
      createdById: validActor.id,
      createdByName: validActor.name,
      version: 1,
      lastMutationId: newMutationId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const predictedDisplaced: PostSlotRow | null = occupant
      ? {
          ...occupant,
          status: 'PENDING_RELOCATION',
          postDate: null,
          previousDate: input.postDate,
          relocationReason: input.reason,
          version: occupant.version + 1,
          updatedAt: nowIso,
        }
      : null;

    const predictedResponse: OverrideSlotResponse = {
      slot: projectManagedSlot(newRow, validActor),
      displacedSlot: predictedDisplaced ? projectManagedSlot(predictedDisplaced, validActor) : null,
      affectedMonths,
    };

    const committed = await this.repo.overrideSlotAtomic({
      newSlot: newRow,
      newAudit: {
        id: crypto.randomUUID(),
        slotId,
        actorId: validActor.id,
        actorName: validActor.name,
        actorRole: validActor.tier,
        action: 'ADMIN_OVERRIDE',
        diffJson: JSON.stringify({
          postDate: input.postDate,
          displacedSlotId: occupant?.id ?? null,
          reason: input.reason,
        }),
        requestId: ctx?.requestId ?? 'unknown',
        createdAt: nowIso,
      },
      displaced: occupant
        ? {
            id: occupant.id,
            expectedVersion: occupant.version,
            nextMutationId: crypto.randomUUID(),
            previousDate: input.postDate,
            relocationReason: input.reason,
            audit: {
              id: crypto.randomUUID(),
              actorId: validActor.id,
              actorName: validActor.name,
              actorRole: validActor.tier,
              action: 'QUEUED_RELOCATION',
              diffJson: JSON.stringify({
                overriddenBySlotId: slotId,
                previousDate: input.postDate,
                reason: input.reason,
              }),
              requestId: ctx?.requestId ?? 'unknown',
              createdAt: nowIso,
            },
          }
        : undefined,
      nowIso,
      idempotency: this.buildIdempotencyInput(
        ctx,
        validActor,
        requestHash,
        occupant ? 200 : 201,
        predictedResponse,
        now,
      ),
    });

    return {
      slot: projectManagedSlot(committed.created, validActor),
      displacedSlot: committed.displaced
        ? projectManagedSlot(committed.displaced, validActor)
        : null,
      affectedMonths,
    };
  }

  async cancelSlot(
    id: string,
    input: CancelSlotInput,
    actor: SeatSessionUser | null,
    ctx?: MutationContext,
  ): Promise<SlotMutationResponse | IdempotentReplayResult<SlotMutationResponse>> {
    const validActor = this.assertAuthenticatedSeat(actor, 'cancel a content slot');
    this.assertReasonIfSuperAdmin(validActor, input.reason);

    const requestHash = await computeRequestHash({ id, ...input });
    const replay = await this.checkIdempotency<SlotMutationResponse>(ctx, validActor, requestHash);
    if (replay) return replay;

    const existing = await this.repo.findById(id);
    if (!existing || existing.status === 'CANCELLED') {
      throw new NotFoundError('Content slot not found');
    }
    if (!this.policy.canMutateSlot(validActor, existing)) {
      throw new ForbiddenError('Only the owning seat or an authorized lead can cancel this slot');
    }

    const now = this.clock();
    const nowIso = now.toISOString();
    const mutationId = crypto.randomUUID();
    const affectedMonths = collectAffectedMonths([existing.postDate, existing.previousDate]);
    const predictedRow: PostSlotRow = {
      ...existing,
      status: 'CANCELLED',
      postDate: null,
      version: input.expectedVersion + 1,
      lastMutationId: mutationId,
      updatedAt: nowIso,
    };
    const predictedResponse: SlotMutationResponse = {
      slot: projectManagedSlot(predictedRow, validActor),
      affectedMonths,
    };

    try {
      const committed = await this.repo.cancelSlotAtomic({
        id,
        expectedVersion: input.expectedVersion,
        nextMutationId: mutationId,
        nowIso,
        audit: {
          id: crypto.randomUUID(),
          actorId: validActor.id,
          actorName: validActor.name,
          actorRole: validActor.tier,
          action: 'CANCELLED',
          diffJson: JSON.stringify({
            previousDate: existing.postDate,
            reason: input.reason ?? null,
          }),
          requestId: ctx?.requestId ?? 'unknown',
          createdAt: nowIso,
        },
        idempotency: this.buildIdempotencyInput(
          ctx,
          validActor,
          requestHash,
          200,
          predictedResponse,
          now,
        ),
      });

      return {
        slot: projectManagedSlot(committed, validActor),
        affectedMonths,
      };
    } catch (error) {
      if (error instanceof PreconditionFailedError && error.details && typeof error.details === 'object') {
        const latest = (error.details as { latest?: PostSlotRow }).latest;
        if (latest) {
          throw new PreconditionFailedError(error.message, {
            latest: projectManagedSlot(latest, validActor),
          });
        }
      }
      throw error;
    }
  }
}
