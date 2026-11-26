# src

## Overview
Top-level TypeScript source tree for the NVMSA OS single-repo modular monolith. It enforces strict zone boundaries separating pure shared contracts (`shared/`), the Cloudflare Workers Hono backend (`server/`), and the React 19 mobile-first PWA client (`client/`).

## Subdirectories & Boundaries
- `client`: [./client/README.md](./client/README.md) — Browser PWA root entrypoint (`main.tsx`) uniting `app/`, `core/`, `modules/`, and `ui/`, permitted to import only `import type { AppType }` from `server/` (`eslint.config.js`).
- `server`: [./server/README.md](./server/README.md) — Cloudflare Worker Hono entrypoint (`index.ts`) composing `/api/*` middleware, Better Auth endpoints, health/session routes, and vertical feature modules (`core/`, `modules/`).
- `shared`: [./shared/README.md](./shared/README.md) — Pure TypeScript contract package re-exporting NVMSA entity/role constants, Zod schemas, inferred types, and `Africa/Cairo` / UTC calendar date helpers with zero React, Hono, or Drizzle dependencies.
