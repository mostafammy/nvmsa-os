# Core (`src/server/core`)

## Overview
Groups the shared server infrastructure subsystems for NVMSA OS: authentication and session resolution, Worker environment typing, Drizzle D1 database client and core auth tables, HTTP-mapped domain errors, and cross-cutting Hono middleware.

## Subdirectories & Boundaries
- Auth: [./auth/README.md](./auth/README.md) - Better Auth SQLite/Drizzle factory (`createAuth`) and Hono `sessionMiddleware` with strictly gated local dev impersonation and role/entity normalization.
- Config: [./config/README.md](./config/README.md) - Cloudflare Worker environment bindings (`Env`), Hono request variables (`AppVariables`), and `AppEnv` type definition.
- DB: [./db/README.md](./db/README.md) - Drizzle ORM client factory (`createDb`, `AppDatabase`) and core SQLite tables (`users`, `sessions`, `accounts`, `verifications`) plus re-exported module tables (`calendarSlots`, `calendarSlotAuditLogs`).
- Errors: [./errors/README.md](./errors/README.md) - Structured HTTP-mapped error hierarchy (`DomainError`, `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409).
- Middleware: [./middleware/README.md](./middleware/README.md) - Hono global `errorHandler`, request ID and structured completion `requestLogger`, and `requireRole` RBAC guard middleware.
