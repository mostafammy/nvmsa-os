# Middleware (`src/server/core/middleware`)

## Overview
Provides cross-cutting Hono middleware and global error handling for request ID correlation, structured request logging, role-based access enforcement, and JSON error serialization.

## Interface
- `[error-handler.ts:errorHandler]`: `ErrorHandler<AppEnv>` formatting `DomainError`, `HTTPException`, and unexpected errors into JSON error responses.
- `[request-logger.ts:requestLogger]`: `MiddlewareHandler<AppEnv>` assigning a per-request ID and logging request completion metadata.
- `[require-role.ts:requireRole]`: `requireRole(minimumRole: UserRole)` factory returning a `MiddlewareHandler<AppEnv>` guard enforcing `minimumRole` via `hasMinimumRole`.

## Invariants
- `[error-handler.ts:errorHandler]`: Every response body uses `{ error: { code, message, requestId } }` with `requestId = c.get('requestId')`.
- `[error-handler.ts:errorHandler]`: `DomainError` maps to `err.statusCode`, `err.code`, and `err.message`; `HTTPException` maps to `err.status`, `'HTTP_ERROR'`, and `err.message`; all other errors map to HTTP `500`, `'INTERNAL_SERVER_ERROR'`, and `'An unexpected error occurred'`.
- `[request-logger.ts:requestLogger]`: Assigns `requestId` as `crypto.randomUUID().slice(0, 8)` before `await next()` and computes `durationMs = Date.now() - start` after `await next()`.
- `[require-role.ts:requireRole]`: Proceeds to `await next()` only when `c.get('user')` is non-null and `hasMinimumRole(user.role, minimumRole)` is true; throws `UnauthorizedError('Sign in to access this action')` (401) if unauthenticated and `ForbiddenError(\`Requires ${minimumRole} role or higher\`)` (403) if the role rank is insufficient.

## Side Effects
- `[error-handler.ts:errorHandler]`: Emits `console.error('[NVMSA OS] Unhandled error', { requestId, err })` for unhandled non-`DomainError`, non-`HTTPException` errors.
- `[request-logger.ts:requestLogger]`: Mutates Hono request context via `c.set('requestId', requestId)`.
- `[request-logger.ts:requestLogger]`: Emits a JSON line to `console.log` containing `{ requestId, method, path, status, durationMs }`.

## Verification
- Run: `pnpm test`
