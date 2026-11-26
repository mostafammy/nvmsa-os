# Auth (`src/server/core/auth`)

## Overview
Provides Better Auth factory configuration and Hono session resolution middleware for NVMSA OS, supporting database-backed email/password sessions as well as strictly gated local development header impersonation.

## Interface
- `[auth.ts:createAuth]`: `createAuth(env: Env)` constructs a `betterAuth` instance backed by the Drizzle SQLite adapter (`schema.users`, `schema.sessions`, `schema.accounts`, `schema.verifications`), `emailAndPassword: { enabled: true }`, `baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173'`, and custom user fields `role` (default `'officer'`) and `entityCode`.
- `[session.ts:sessionMiddleware]`: Hono `MiddlewareHandler<AppEnv>` that resolves the active `SessionUser | null`, sets `c.set('user', ...)`, and invokes `await next()`.

## Invariants
- `[auth.ts:resolveAuthSecret]`: `BETTER_AUTH_SECRET` (trimmed) must be at least 32 characters (`MIN_SECRET_LENGTH = 32`); only when `env.APP_ENV === 'development'` does it fall back to `'local-dev-only-secret-do-not-use-in-production-32+'`, otherwise throwing an `Error`.
- `[auth.ts:createAuth]`: Email/password authentication is enabled via SQLite Drizzle adapter tables (`user`, `session`, `account`, `verification`), with user `additionalFields` (`role` optional string defaulting to `'officer'`; `entityCode` optional string).
- `[session.ts:sessionMiddleware]`: Development header impersonation (`x-dev-role`) is active ONLY when both `c.env.APP_ENV === 'development'` and `c.env.ALLOW_DEV_IMPERSONATION === 'true'`; when triggered, it synthesizes a `SessionUser` with `id` from `x-dev-user-id` (or `dev-${role}`), `name` from `x-dev-user-name` (or role-based default `'NVMSA Admin'` / `'EB Member'` / `'NVMSA Officer'`), and `email` `${role}@nvmsa.local` without calling Better Auth.
- `[session.ts:parseRole]`: Incoming role values from `x-dev-role` or `result.user.role` must belong to `USER_ROLES`, otherwise defaulting to `'officer'`.
- `[session.ts:parseEntityCode]`: Incoming entity codes from `x-dev-entity` or `result.user.entityCode` must belong to `NVMSA_ENTITY_CODES`, otherwise normalizing to `null`.
- `[session.ts:sessionMiddleware]`: Outside active dev impersonation, missing sessions or thrown exceptions from `createAuth(c.env)` / `auth.api.getSession` always resolve `c.set('user', null)` rather than aborting the request.

## Side Effects
- `[auth.ts:createAuth]`: Instantiates a Drizzle DB client via `createDb(env.DB)` and a `betterAuth` instance per invocation (and throws an `Error` via `[auth.ts:resolveAuthSecret]` if the secret invariant fails outside `'development'`).
- `[session.ts:sessionMiddleware]`: Mutates Hono request context via `c.set('user', SessionUser | null)`.
- `[session.ts:sessionMiddleware]`: In non-impersonation requests, calls `createAuth(c.env)` and executes `auth.api.getSession({ headers: c.req.raw.headers })`, performing a D1 database session lookup.

## Verification
- Run: `pnpm test`
