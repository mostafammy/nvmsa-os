# Server (`src/server`)

## Overview
Composes the NVMSA OS Cloudflare Worker Hono application (`index.ts`), wiring global request logging, Better Auth session resolution, error handling, authentication endpoints, and domain feature modules under `/api`.

## Interface
- `[index.ts:AppType]`: Exported Hono RPC type `typeof app` for typed client consumers.
- `[index.ts:app]` / `[index.ts:default]`: Default-exported `Hono<AppEnv>` worker entrypoint mounting `/api` routes:
  - `GET /api/health` (`[index.ts:api]`): Returns JSON `{ status: 'ok', service: 'nvmsa-os', timezone: c.env.APP_TIMEZONE ?? 'Africa/Cairo' }`.
  - `GET /api/me` (`[index.ts:api]`): Returns JSON `{ user: c.get('user') }`.
  - `POST`, `GET /api/auth/*` (`[index.ts:api]`): Instantiates `createAuth(c.env)` and delegates `c.req.raw` to Better Auth's `auth.handler`.
  - `/api/calendar/*` (`[index.ts:api]`): Mounts `calendarRoutes` (`GET /slots`, `GET /slots/:id/history`, `POST /slots`, `PATCH /slots/:id`, `POST /slots/:id/relocate`, `DELETE /slots/:id`).
- Core infrastructure ([./core/README.md](./core/README.md)): Provides `createAuth`/`sessionMiddleware`, `Env`/`AppVariables`/`AppEnv`, `createDb`/`AppDatabase` and auth tables, `DomainError` HTTP error classes, and `errorHandler`/`requestLogger`/`requireRole`.
- Feature modules ([./modules/README.md](./modules/README.md)): Provides domain modules including the editorial content calendar (`calendarRoutes`, `calendarSlots`, `CalendarService`, `D1SlotRepository`, `InMemorySlotRepository`, `defaultCalendarPolicy`).

## Invariants
- `[index.ts:app]`: Middleware on `/api/*` is ordered with `requestLogger` first and `sessionMiddleware` second, ensuring `requestId` is populated before session resolution, route execution, and `app.onError(errorHandler)`.
- `[index.ts:app]`: Unhandled exceptions and `DomainError`/`HTTPException` throws on `app` are routed through `app.onError(errorHandler)`.
- `[index.ts:api]`: `/api/health` falls back to `'Africa/Cairo'` when `c.env.APP_TIMEZONE` is nullish, and `/api/auth/*` accepts only `POST` and `GET` HTTP methods.

## Side Effects
- `[index.ts:app]`: Registers `/api/*` request middleware (`requestLogger` mutates `requestId` and logs JSON lines; `sessionMiddleware` reads auth sessions from D1 and mutates `user` on context) and mounts `calendarRoutes` (which reads/writes D1 `calendar_slots` and `calendar_slot_audit_logs`).
- `[index.ts:api]`: `/api/auth/*` invokes `createAuth(c.env)` and `auth.handler(c.req.raw)` per request, mutating Better Auth D1 tables (`user`, `session`, `account`, `verification`) on auth flows.

## Verification
- Run: `pnpm test`
