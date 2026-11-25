import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class DomainError extends Error {
  readonly statusCode: ContentfulStatusCode;
  readonly code: string;

  constructor(message: string, statusCode: ContentfulStatusCode, code: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Requested resource was not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}
