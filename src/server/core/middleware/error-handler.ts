import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../config/env';
import { DomainError } from '../errors/domain-errors';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get('requestId') || crypto.randomUUID();
  c.header('X-Request-Id', requestId);

  if (err instanceof DomainError) {
    if (err.statusCode === 409) {
      c.set('telemetryOutcome', 'date_race_409');
    } else if (err.statusCode === 412) {
      c.set('telemetryOutcome', 'occ_stale_412');
    } else if (err.statusCode === 422) {
      c.set('telemetryOutcome', 'idempotency_conflict_422');
    }

    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
          requestId,
        },
      },
      err.statusCode,
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: 'HTTP_ERROR',
          message: err.message,
          requestId,
        },
      },
      err.status,
    );
  }

  console.error(
    JSON.stringify({
      event: 'unhandled_error',
      requestId,
      cfRay: c.req.header('cf-ray') ?? null,
      method: c.req.method,
      path: c.req.path,
      message: err instanceof Error ? err.message : 'Unknown error',
    }),
  );

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    },
    500,
  );
};
