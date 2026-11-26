# Errors (`src/server/core/errors`)

## Overview
Defines the structured domain error hierarchy mapping business and authorization failures to HTTP status codes and machine-readable error codes.

## Interface
- `[domain-errors.ts:DomainError]`: Base `Error` subclass carrying `readonly statusCode: ContentfulStatusCode` and `readonly code: string`.
- `[domain-errors.ts:ValidationError]`: `DomainError` subclass for input or rule validation failures (`constructor(message: string)`).
- `[domain-errors.ts:UnauthorizedError]`: `DomainError` subclass for missing authentication (`constructor(message = 'Authentication required')`).
- `[domain-errors.ts:ForbiddenError]`: `DomainError` subclass for insufficient permissions (`constructor(message = 'You do not have permission to perform this action')`).
- `[domain-errors.ts:NotFoundError]`: `DomainError` subclass for missing resources (`constructor(message = 'Requested resource was not found')`).
- `[domain-errors.ts:ConflictError]`: `DomainError` subclass for state or uniqueness conflicts (`constructor(message = 'Resource conflict')`).

## Invariants
- `[domain-errors.ts:DomainError]`: `statusCode` and `code` are `readonly` instance fields assigned at construction, and `this.name` is set to `new.target.name`.
- `[domain-errors.ts:ValidationError]`: Fixed to HTTP `400` and code `'VALIDATION_ERROR'`.
- `[domain-errors.ts:UnauthorizedError]`: Fixed to HTTP `401` and code `'UNAUTHORIZED'`.
- `[domain-errors.ts:ForbiddenError]`: Fixed to HTTP `403` and code `'FORBIDDEN'`.
- `[domain-errors.ts:NotFoundError]`: Fixed to HTTP `404` and code `'NOT_FOUND'`.
- `[domain-errors.ts:ConflictError]`: Fixed to HTTP `409` and code `'CONFLICT'`.

## Side Effects
- None

## Verification
- Run: `pnpm test`
