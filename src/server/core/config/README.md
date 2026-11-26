# Config (`src/server/core/config`)

## Overview
Defines the Cloudflare Workers environment bindings and Hono request context variable types shared across server middleware, core infrastructure, and domain route modules.

## Interface
- `[env.ts:Env]`: Worker bindings interface declaring `DB: D1Database`, `BETTER_AUTH_SECRET: string`, `BETTER_AUTH_URL: string`, and optional `APP_ENV?: 'development' | 'staging' | 'production'`, `ALLOW_DEV_IMPERSONATION?: string`, and `APP_TIMEZONE?: string`.
- `[env.ts:AppVariables]`: Hono context variables interface declaring `user: SessionUser | null` and `requestId: string`.
- `[env.ts:AppEnv]`: Hono environment type mapping `{ Bindings: Env; Variables: AppVariables }`.

## Invariants
- None

## Side Effects
- None

## Verification
- Run: `pnpm test`
