import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { ContentType, SlotAuditAction, SlotStatus } from '@shared/types';
import { orgUnits } from '../admin/admin.table';

export const postSlots = sqliteTable(
  'post_slots',
  {
    id: text('id').primaryKey(),
    postDate: text('post_date'),
    status: text('status').$type<SlotStatus>().notNull().default('BOOKED'),
    orgUnitId: text('org_unit_id')
      .notNull()
      .references(() => orgUnits.id, { onDelete: 'restrict' }),
    contentType: text('content_type').$type<ContentType>().notNull().default('POST'),
    title: text('title').notNull(),
    notes: text('notes'),
    assetUrl: text('asset_url'),
    relocationReason: text('relocation_reason'),
    previousDate: text('previous_date'),
    ownerSeatCode: text('owner_seat_code').notNull(),
    createdById: text('created_by_id').notNull(),
    createdByName: text('created_by_name').notNull(),
    version: integer('version').notNull().default(1),
    lastMutationId: text('last_mutation_id').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('uq_active_post_date')
      .on(table.postDate)
      .where(sql`${table.status} = 'BOOKED'`),
    index('idx_post_slots_status_date').on(table.status, table.postDate),
    index('idx_post_slots_owner_seat').on(table.ownerSeatCode, table.status),
  ],
);

export const idempotencyKeys = sqliteTable(
  'idempotency_keys',
  {
    key: text('key').notNull(),
    userId: text('user_id').notNull(),
    route: text('route').notNull(),
    requestHash: text('request_hash').notNull(),
    responseCode: integer('response_code').notNull(),
    responseBody: text('response_body').notNull(),
    createdAt: text('created_at').notNull(),
    expiresAt: text('expires_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.key, table.userId, table.route] }),
    index('idx_idempotency_expires').on(table.expiresAt),
  ],
);

export const slotAuditLogs = sqliteTable(
  'slot_audit_log',
  {
    id: text('id').primaryKey(),
    slotId: text('slot_id')
      .notNull()
      .references(() => postSlots.id, { onDelete: 'cascade' }),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    actorRole: text('actor_role').notNull(),
    action: text('action').$type<SlotAuditAction>().notNull(),
    diffJson: text('diff_json').notNull(),
    requestId: text('request_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_slot_audit_slot_time').on(table.slotId, table.createdAt)],
);

export type PostSlotRow = typeof postSlots.$inferSelect;
export type NewPostSlotRow = typeof postSlots.$inferInsert;
export type IdempotencyKeyRow = typeof idempotencyKeys.$inferSelect;
export type NewIdempotencyKeyRow = typeof idempotencyKeys.$inferInsert;
export type SlotAuditLogRow = typeof slotAuditLogs.$inferSelect;
export type NewSlotAuditLogRow = typeof slotAuditLogs.$inferInsert;
