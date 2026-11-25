import { sql } from 'drizzle-orm';
import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { NvmsaEntityCode } from '@shared/constants';
import type { PostFormat, SlotStatus } from '@shared/types';

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

export type CalendarSlotRow = typeof calendarSlots.$inferSelect;
export type NewCalendarSlotRow = typeof calendarSlots.$inferInsert;
