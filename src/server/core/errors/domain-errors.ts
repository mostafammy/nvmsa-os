import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class DomainError extends Error {
  readonly statusCode: ContentfulStatusCode;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: ContentfulStatusCode,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Requested resource was not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class PreconditionFailedError extends DomainError {
  constructor(
    message = 'This slot was updated by someone else. Review the latest state and try again.',
    details?: unknown,
  ) {
    super(message, 412, 'PRECONDITION_FAILED', details);
  }
}

export class UnprocessableEntityError extends DomainError {
  constructor(message = 'Idempotency key reused with a different request payload', details?: unknown) {
    super(message, 422, 'IDEMPOTENCY_CONFLICT', details);
  }
}
