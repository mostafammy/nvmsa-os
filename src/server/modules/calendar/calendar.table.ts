import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { NvmsaEntityCode, UserRole } from '@shared/constants';
import type { PostFormat, SlotAuditAction, SlotStatus } from '@shared/types';

export const calendarSlots = sqliteTable(
  'calendar_slots',
  {
    id: text('id').primaryKey(),
    postDate: text('post_date').notNull(),
    title: text('title').notNull(),
    entityCode: text('entity_code').$type<NvmsaEntityCode>().notNull(),
    format: text('format').$type<PostFormat>().notNull().default('poster'),
    status: text('status').$type<SlotStatus>().notNull().default('booked'),
    notes: text('notes'),
    relocationReason: text('relocation_reason'),
    creatorId: text('creator_id').notNull(),
    creatorName: text('creator_name').notNull(),
    version: integer('version').notNull().default(1),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('calendar_slots_booked_date_uidx')
      .on(table.postDate)
      .where(sql`${table.status} = 'booked'`),
    index('calendar_slots_status_date_idx').on(table.status, table.postDate),
  ],
);

export const calendarSlotAuditLogs = sqliteTable(
  'calendar_slot_audit_logs',
  {
    id: text('id').primaryKey(),
    slotId: text('slot_id')
      .notNull()
      .references(() => calendarSlots.id, { onDelete: 'cascade' }),
    action: text('action').$type<SlotAuditAction>().notNull(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    actorRole: text('actor_role').$type<UserRole>().notNull(),
    previousDate: text('previous_date'),
    nextDate: text('next_date'),
    reason: text('reason'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('calendar_slot_audit_slot_idx').on(table.slotId, table.createdAt)],
);

export type CalendarSlotRow = typeof calendarSlots.$inferSelect;
export type NewCalendarSlotRow = typeof calendarSlots.$inferInsert;
export type CalendarSlotAuditRow = typeof calendarSlotAuditLogs.$inferSelect;
export type NewCalendarSlotAuditRow = typeof calendarSlotAuditLogs.$inferInsert;
