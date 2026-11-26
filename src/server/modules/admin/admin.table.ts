import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { AccentToken, SeatBranch, VisibleSeatTier } from '@shared/constants';
import type { OrgUnitKind } from '@shared/types';

export const orgUnits = sqliteTable('org_units', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  kind: text('kind').$type<OrgUnitKind>().notNull(),
  accentToken: text('accent_token').$type<AccentToken>().notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const officeSeats = sqliteTable('office_seats', {
  seatCode: text('seat_code').primaryKey(),
  branch: text('branch').$type<SeatBranch>().notNull(),
  title: text('title').notNull(),
  tier: text('tier').$type<VisibleSeatTier>().notNull(),
  assignedEmail: text('assigned_email').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});

export const seatAllowedUnits = sqliteTable(
  'seat_allowed_units',
  {
    seatCode: text('seat_code')
      .notNull()
      .references(() => officeSeats.seatCode, { onDelete: 'cascade' }),
    orgUnitId: text('org_unit_id')
      .notNull()
      .references(() => orgUnits.id, { onDelete: 'restrict' }),
  },
  (table) => [primaryKey({ columns: [table.seatCode, table.orgUnitId] })],
);

export const seatAuditLogs = sqliteTable(
  'seat_audit_log',
  {
    id: text('id').primaryKey(),
    targetType: text('target_type').$type<'SEAT' | 'ORG_UNIT'>().notNull(),
    targetId: text('target_id').notNull(),
    actorId: text('actor_id').notNull(),
    actorRole: text('actor_role').notNull(),
    action: text('action').notNull(),
    diffJson: text('diff_json').notNull(),
    requestId: text('request_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_seat_audit_target').on(table.targetType, table.targetId, table.createdAt)],
);

export type OrgUnitRow = typeof orgUnits.$inferSelect;
export type NewOrgUnitRow = typeof orgUnits.$inferInsert;
export type OfficeSeatRow = typeof officeSeats.$inferSelect;
export type SeatAllowedUnitRow = typeof seatAllowedUnits.$inferSelect;
export type SeatAuditLogRow = typeof seatAuditLogs.$inferSelect;
export type NewSeatAuditLogRow = typeof seatAuditLogs.$inferInsert;
