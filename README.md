# NVMSA OS

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
