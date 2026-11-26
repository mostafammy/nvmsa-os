# DB (`src/server/core/db`)

## Overview
Provides the Drizzle ORM client factory for Cloudflare D1 and defines the core SQLite authentication tables while re-exporting module tables into a unified schema.

## Interface
- `[client.ts:createDb]`: `createDb(d1: D1Database)` constructs a Drizzle D1 client bound to all tables exported from `./schema`.
- `[client.ts:AppDatabase]`: Type alias `ReturnType<typeof createDb>`.
- `[schema.ts:users]`: Drizzle `sqliteTable('user', ...)` defining columns `id`, `name`, `email`, `emailVerified` (`email_verified`), `image`, `role`, `entityCode` (`entity_code`), `createdAt` (`created_at`), and `updatedAt` (`updated_at`).
- `[schema.ts:sessions]`: Drizzle `sqliteTable('session', ...)` defining columns `id`, `expiresAt` (`expires_at`), `token`, `createdAt` (`created_at`), `updatedAt` (`updated_at`), `ipAddress` (`ip_address`), `userAgent` (`user_agent`), and `userId` (`user_id`).
- `[schema.ts:accounts]`: Drizzle `sqliteTable('account', ...)` defining columns `id`, `accountId` (`account_id`), `providerId` (`provider_id`), `userId` (`user_id`), `accessToken` (`access_token`), `refreshToken` (`refresh_token`), `idToken` (`id_token`), `accessTokenExpiresAt` (`access_token_expires_at`), `refreshTokenExpiresAt` (`refresh_token_expires_at`), `scope`, `password`, `createdAt` (`created_at`), and `updatedAt` (`updated_at`).
- `[schema.ts:verifications]`: Drizzle `sqliteTable('verification', ...)` defining columns `id`, `identifier`, `value`, `expiresAt` (`expires_at`), `createdAt` (`created_at`), and `updatedAt` (`updated_at`).
- `[schema.ts:calendarSlots]`: Re-exported from `../../modules/calendar/calendar.table` ([Calendar module](../../modules/calendar/README.md)).
- `[schema.ts:calendarSlotAuditLogs]`: Re-exported from `../../modules/calendar/calendar.table` ([Calendar module](../../modules/calendar/README.md)).

## Invariants
- `[schema.ts:users]`: `id` is the primary key; `email` is `notNull().unique()`; `name`, `createdAt` (`mode: 'timestamp'`), and `updatedAt` (`mode: 'timestamp'`) are `notNull()`; `emailVerified` (`mode: 'boolean'`) is `notNull().default(false)`; `role` is `notNull().default('officer')`; `image` and `entityCode` are nullable.
- `[schema.ts:sessions]`: `id` is the primary key; `token` is `notNull().unique()`; `expiresAt`, `createdAt`, and `updatedAt` (`mode: 'timestamp'`) are `notNull()`; `userId` is `notNull()` and references `users.id` with `{ onDelete: 'cascade' }`; `ipAddress` and `userAgent` are nullable.
- `[schema.ts:accounts]`: `id` is the primary key; `accountId`, `providerId`, `createdAt` (`mode: 'timestamp'`), and `updatedAt` (`mode: 'timestamp'`) are `notNull()`; `userId` is `notNull()` and references `users.id` with `{ onDelete: 'cascade' }`; token, expiration, `scope`, and `password` fields are nullable.
- `[schema.ts:verifications]`: `id` is the primary key; `identifier`, `value`, and `expiresAt` (`mode: 'timestamp'`) are `notNull()`; `createdAt` and `updatedAt` (`mode: 'timestamp'`) are nullable.

## Side Effects
- None

## Verification
- Run: `pnpm test`
