# NVMSA OS Blueprint

## System Overview

Modular, mobile-first operating system for **New Valley Medical Students' Association (NVMSA)** — starting with a 1-post-per-day content calendar PWA.

**Stack:** React 19 · Vite · Tailwind CSS · Hono RPC · Cloudflare Workers · Cloudflare D1 · Drizzle ORM · Better Auth · TypeScript

## Module Roadmap

| Version | Module | Status | Scope |
| --- | --- | --- | --- |
| **v1.0** | **Content Calendar** | Active | 1-post-per-day locker, Officer read-only view, EB creator-locked editing, Relocation Queue |
| **v1.x** | **Activities & Events** | Planned | Activity proposals, enrollment forms, and impact tracking |
| **v2.0** | **Recruitment & Member Hub** | Planned | Member directory, committee onboarding, and handover logs |

## Architecture & Design Principles

- **Single-Repo Modular Monolith**: Built through Cloudflare's Vite plugin from a single `package.json`, keeping `shared/`, `server/`, and `client/` strictly isolated via `tsconfig.*.json` project references and ESLint rules.
- **Vertical Slices**: Every NVMSA OS module lives in a mirrored `src/server/modules/<name>/` and `src/client/modules/<name>/` folder, registered through a single `modules.registry.ts` manifest.
- **Repository + Policy Patterns**: Business rules in `*.service.ts` depend on repository interfaces (`ISlotRepository`) and pure authorization functions (`*.policy.ts`), enabling fast Vitest unit tests with an in-memory repository.
- **DB-Level Concurrency Guarantees**: D1 enforces the 1-post-per-day rule via a partial unique index (`WHERE status = 'booked'`) so concurrent booking requests cannot double-book the same Cairo calendar date.

## Directory Map

```text
nvmsa-os/
├── .github/workflows/       # ci.yml (lint, typecheck, test) & deploy.yml
├── drizzle/                 # Version-controlled D1 SQL migrations
├── public/                  # PWA manifest, service worker, and icons
└── src/
    ├── shared/              # Pure TS contracts (constants, Zod schemas, DTOs, Cairo date utils)
    ├── server/
    │   ├── core/            # Env bindings, Drizzle D1 client, Better Auth, errors, middleware
    │   └── modules/         # Vertical slices (1 folder = 1 NVMSA OS module)
    │       └── calendar/    # table, repository, policy, service, routes, tests
    └── client/
        ├── app/             # OS Shell, lazy router, modules.registry.ts, MobileShell
        ├── core/            # Typed Hono RPC client (hc<AppType>), auth, SWR cache
        ├── ui/              # Atomic primitives (BottomSheet, Button, Badge)
        └── modules/         # Mirrors server/modules/ 1-to-1
            └── calendar/    # index.ts barrel, api, components, hooks, pages
```

## Local Development Quick Start

```bash
cp .dev.vars.example .dev.vars
pnpm install
pnpm db:migrate:local
pnpm dev
```

Other common commands:

```bash
pnpm lint       # ESLint including strict zone & module boundary checks
pnpm typecheck  # TypeScript project references check (app + worker)
pnpm test       # Vitest unit tests (in-memory repositories)
pnpm deploy     # Build SPA + Worker bundle and deploy to Cloudflare
```

## Role & Permission Matrix

| Capability | Officer (Public) | EB Member | Admin |
| --- | :---: | :---: | :---: |
| View monthly calendar & public slot cards | Yes | Yes | Yes |
| Book an open date slot | No | Yes | Yes |
| Edit or cancel own booked slot | No | Yes | Yes |
| Edit or cancel another member's slot | No | No | Yes |
| Move slot to Relocation Queue / Override slot | No | Own only | Any slot |

## Adding a New Module (Contributor Guide)

1. **Define shared contracts** in `src/shared/schemas/<module>.schema.ts` and export inferred DTOs from `src/shared/types/`.
2. **Create the server vertical slice** in `src/server/modules/<module>/` (`table`, `repository`, `policy`, `service`, `routes`, `service.test.ts`), export its table in `src/server/core/db/schema.ts`, generate a D1 migration (`pnpm db:generate`), and mount its routes in `src/server/index.ts`.
3. **Create the client vertical slice** in `src/client/modules/<module>/` with a single public `index.ts` barrel exporting the lazy page component.
4. **Register the module** by adding one entry to `src/client/app/modules.registry.ts` — the OS shell router and bottom navigation pick it up automatically.

## Branching & Commit Conventions

- **Branches**: `main` (auto-deploys to production), `feat/<module>-<short-desc>`, `fix/<module>-<short-desc>`.
- **Conventional Commits** scoped by module: `feat(calendar): enforce creator-only edit policy`, `feat(shell): add bottom navigation module registry`, `chore(db): add partial unique index on booked post_date`.

## Architecture & Engineering Specifications

- **[NVMSA OS Master Specification (`NVMSA-RFC-001`)](./docs/specs/NVMSA_OS_MASTER_SPEC.md)** — Authoritative Principal Engineering RFC covering the v1.0 defect & security audit, system architecture, D1 batch atomicity & Cairo timezone invariants, 16-item 60/120Hz fluid motion choreography catalog, 25-scenario adversarial QA edge-case matrix, and Cloudflare Workers ephemeral PR branch preview & canary rollout pipelines.

## Local Interface & Invariants

- `[drizzle.config.ts:default]` — Default-exported `defineConfig({ schema: './src/server/core/db/schema.ts', out: './drizzle', dialect: 'sqlite' })` binding Drizzle Kit migrations to the SQLite schema barrel.
- `[eslint.config.js:default]` — Flat ESLint config enforcing zone isolation across `src/shared/**` (blocks `react`, `react-*`, `hono`, `drizzle-orm`, `@client/*`, `@server/*`), `src/client/**` (allows `@server/*` only with `allowTypeImports: true`, restricts cross-module imports to root `index.ts` barrels via `@client/modules/*/*`), and `src/server/core/**/*.ts` (blocks `@server/modules/*` except `src/server/core/db/schema.ts`).
- `[vite.config.ts:default]` — Default-exported `defineConfig` wiring `react()`, `tailwindcss()`, and `cloudflare()` plugins plus `@shared`, `@client`, and `@server` path aliases.
- `[vitest.config.ts:default]` — Default-exported `defineConfig` running `src/**/*.test.ts` in the `node` environment (`globals: false`) with `@shared`, `@client`, and `@server` aliases.
- **Invariant (`[tsconfig.app.json]`, `[tsconfig.worker.json]`)**: Client builds (`src/client`, `src/shared`) exclude `src/server` and allow `@server/index` only for type imports; Worker builds (`src/server`, `src/shared`) exclude `src/client`.
- **Side Effects (`Local Configs`)**: Build-time and CLI tooling only (`drizzle-kit` generates SQL into `./drizzle`; Vite emits SSR Worker and client bundles into `./dist`).

## Subdirectories & System Boundaries

- `drizzle`: [./drizzle/README.md](./drizzle/README.md) — SQLite / Cloudflare D1 DDL migrations (`0000_init_calendar.sql`, `0001_audit_and_versioning.sql`) provisioning Better Auth tables, `calendar_slots` (with partial unique index and `version`), and `calendar_slot_audit_logs`.
- `public`: [./public/README.md](./public/README.md) — Service Worker (`sw.js`) pre-caching `['/', '/manifest.webmanifest']` in Cache Storage `'nvmsa-os-v1'` and serving network-first fallbacks for non-`/api/` `GET` requests.
- `src`: [./src/README.md](./src/README.md) — Modular monolith TypeScript source tree separating `./src/shared/README.md`, `./src/server/README.md`, and `./src/client/README.md`.

## Global Invariants

- **Single Booked Post Per Cairo Date (`[0000_init_calendar.sql:calendar_slots_booked_date_uidx]`, `[calendar.table.ts:calendarSlots]`)**: Partial unique index on `calendar_slots (post_date) WHERE status = 'booked'` enforces at most one booked slot per calendar date at the database level.
- **Strict Zone & Module Isolation (`[eslint.config.js:default]`, `[tsconfig.app.json]`, `[tsconfig.worker.json]`)**: `src/shared` remains pure TypeScript, `src/client` imports only `import type { AppType }` from `src/server`, and `src/server/core` never imports `src/server/modules/*` outside `schema.ts`.
- **Africa/Cairo Date Authority (`[date.ts:CAIRO_TIMEZONE]`, `[calendar.service.ts:CalendarService]`)**: Non-admin slot bookings and relocations reject dates earlier than `getTodayCairoDate()` evaluated in `Africa/Cairo`.
- **Fail-Closed Auth & Dev Impersonation (`[auth.ts:resolveAuthSecret]`, `[session.ts:sessionMiddleware]`)**: Non-development environments reject missing or `< 32`-char `BETTER_AUTH_SECRET` values; `x-dev-role` impersonation headers activate only when both `APP_ENV === 'development'` and `ALLOW_DEV_IMPERSONATION === 'true'`.
- **Creator-Only Mutation & OCC Versioning (`[calendar.policy.ts:defaultCalendarPolicy]`, `[calendar.repository.ts:D1SlotRepository]`)**: Only slot creators (`eb`) or `admin` users may edit, relocate, or cancel slots; updates with `expectedVersion` increment `version + 1` and throw `ConflictError` on mismatch.

## Global Side Effects

- **Cloudflare D1 (`nvmsa-os-db` in `[wrangler.jsonc]`)**: Drizzle migrations (`0000`, `0001`) mutate schema DDL; runtime `/api/auth/*` and `/api/calendar/*` handlers read and write `user`, `session`, `account`, `verification`, `calendar_slots`, and `calendar_slot_audit_logs`.
- **Browser Storage & Service Worker (`[cache.ts]`, `[client.ts]`, `[sw.js]`)**: Client code persists SWR payloads (`nvmsa_os_swr:*`) and DEV-only personas (`nvmsa_os_dev_persona`) in `localStorage`, while `sw.js` manages Cache Storage bucket `'nvmsa-os-v1'`.
- **Observability (`[request-logger.ts:requestLogger]`, `[error-handler.ts:errorHandler]`)**: Emits structured request JSON logs via `console.log` and unhandled exception logs via `console.error` on `/api/*` requests.

## System Verification

- Run: `pnpm test`
- Run: `pnpm lint && pnpm typecheck`
