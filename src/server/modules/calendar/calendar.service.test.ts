import { describe, expect, it } from 'vitest';
import type { SessionUser } from '@shared/types';
import { ConflictError, ForbiddenError } from '../../core/errors/domain-errors';
import { defaultCalendarPolicy } from './calendar.policy';
import { InMemorySlotRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';

const officerUser: SessionUser = {
  id: 'u-officer',
  name: 'Nour Officer',
  email: 'officer@nvmsa.org',
  role: 'officer',
  entityCode: 'SCOPH',
};

const ebAlice: SessionUser = {
  id: 'u-eb-alice',
  name: 'Salma (SCOPH)',
  email: 'salma@nvmsa.org',
  role: 'eb',
  entityCode: 'SCOPH',
};

const ebBob: SessionUser = {
  id: 'u-eb-bob',
  name: 'Omar (SCOME)',
  email: 'omar@nvmsa.org',
  role: 'eb',
  entityCode: 'SCOME',
};

const adminUser: SessionUser = {
  id: 'u-admin',
  name: 'Mostafa (PNSDD)',
  email: 'admin@nvmsa.org',
  role: 'admin',
  entityCode: 'PNSDD',
};

function createTestService() {
  const repo = new InMemorySlotRepository();
  const service = new CalendarService(
    repo,
    defaultCalendarPolicy,
    () => new Date('2026-11-25T10:00:00.000Z'),
  );
  return { repo, service };
}

describe('CalendarService', () => {
  it('enforces the 1-post-per-day lock across concurrent or duplicate bookings', async () => {
    const { service } = createTestService();

    const first = await service.bookSlot(
      {
        postDate: '2026-12-01',
        title: 'World AIDS Day Awareness',
        entityCode: 'SCORA',
        format: 'carousel',
        notes: 'Publish at 7 PM Cairo time',
      },
      ebAlice,
    );

    expect(first.status).toBe('booked');
    expect(first.postDate).toBe('2026-12-01');

    await expect(
      service.bookSlot(
        {
          postDate: '2026-12-01',
          title: 'Conflicting SCOME Workshop',
          entityCode: 'SCOME',
          format: 'poster',
        },
        ebBob,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it('blocks Officers from booking and strips managed fields from Officer views (ISP)', async () => {
    const { service } = createTestService();

    await expect(
      service.bookSlot(
        {
          postDate: '2026-12-02',
          title: 'Unauthorized Officer Post',
          entityCode: 'SCOPH',
          format: 'poster',
        },
        officerUser,
      ),
    ).rejects.toThrow(ForbiddenError);

    await service.bookSlot(
      {
        postDate: '2026-12-02',
        title: 'Diabetes Screening Recap',
        entityCode: 'SCOPH',
        format: 'reel',
        notes: 'Internal EB note only',
      },
      ebAlice,
    );

    const publicView = await service.listMonth('2026-12', officerUser);
    expect(publicView.slots).toHaveLength(1);
    expect('notes' in (publicView.slots[0] ?? {})).toBe(false);
    expect('creatorId' in (publicView.slots[0] ?? {})).toBe(false);
    expect(publicView.relocationQueue).toHaveLength(0);

    const ebView = await service.listMonth('2026-12', ebAlice);
    expect(ebView.slots).toHaveLength(1);
    expect('notes' in (ebView.slots[0] ?? {})).toBe(true);
  });

  it('enforces creator-only editing for EB members while allowing Admin overrides', async () => {
    const { service } = createTestService();

    const slot = await service.bookSlot(
      {
        postDate: '2026-12-05',
        title: 'Initial Title',
        entityCode: 'SCOPH',
        format: 'poster',
      },
      ebAlice,
    );

    await expect(
      service.updateSlot(slot.id, { title: 'Bob Tampering' }, ebBob),
    ).rejects.toThrow(ForbiddenError);

    const selfUpdated = await service.updateSlot(
      slot.id,
      { title: 'Updated by Creator' },
      ebAlice,
    );
    expect(selfUpdated.title).toBe('Updated by Creator');

    const adminOverride = await service.updateSlot(
      slot.id,
      { title: 'Approved by Admin' },
      adminUser,
    );
    expect(adminOverride.title).toBe('Approved by Admin');
  });

  it('frees the original date when moved to Relocation Queue and allows rescheduling onto an open date', async () => {
    const { service } = createTestService();

    const original = await service.bookSlot(
      {
        postDate: '2026-12-10',
        title: 'Human Rights Day Campaign',
        entityCode: 'SCORP',
        format: 'carousel',
      },
      ebAlice,
    );

    // Move to Relocation Queue
    const queued = await service.relocateSlot(
      original.id,
      { reason: 'Waiting for final designer exports' },
      ebAlice,
    );
    expect(queued.status).toBe('relocation_queue');

    // Original date is now free for another committee
    const replacement = await service.bookSlot(
      {
        postDate: '2026-12-10',
        title: 'Urgent General Assembly Reminder',
        entityCode: 'EB',
        format: 'announcement',
      },
      ebBob,
    );
    expect(replacement.postDate).toBe('2026-12-10');

    // Trying to reschedule back onto the occupied date throws ConflictError
    await expect(
      service.relocateSlot(
        original.id,
        { targetDate: '2026-12-10', reason: 'Attempt to reclaim occupied day' },
        ebAlice,
      ),
    ).rejects.toThrow(ConflictError);

    // Rescheduling onto an open date succeeds
    const rescheduled = await service.relocateSlot(
      original.id,
      { targetDate: '2026-12-12', reason: 'Assets ready for Dec 12' },
      ebAlice,
    );
    expect(rescheduled.status).toBe('booked');
    expect(rescheduled.postDate).toBe('2026-12-12');
  });

  it('frees a date after cancellation', async () => {
    const { service } = createTestService();

    const slot = await service.bookSlot(
      {
        postDate: '2026-12-15',
        title: 'Tentative Poster',
        entityCode: 'PSDD',
        format: 'poster',
      },
      ebAlice,
    );

    const cancelled = await service.cancelSlot(slot.id, ebAlice);
    expect(cancelled.status).toBe('cancelled');

    const rebooked = await service.bookSlot(
      {
        postDate: '2026-12-15',
        title: 'Confirmed Exchange Call',
        entityCode: 'SCOPE',
        format: 'announcement',
      },
      ebBob,
    );
    expect(rebooked.entityCode).toBe('SCOPE');
  });
});
