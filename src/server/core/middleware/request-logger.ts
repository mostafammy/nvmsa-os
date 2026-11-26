import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../config/env';

export const requestLogger: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.set('authOutcome', 'public');
  const start = Date.now();

  await next();

  c.header('X-Request-Id', requestId);

  const user = c.get('user');
  const durationMs = Date.now() - start;

  console.log(
    JSON.stringify({
      requestId,
      cfRay: c.req.header('cf-ray') ?? null,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
      authOutcome: c.get('authOutcome'),
      seatCode: user?.seatCode ?? null,
      outcome: c.get('telemetryOutcome') ?? null,
      orgUnitId: c.get('telemetryOrgUnitId') ?? null,
      d1RowsRead: c.get('d1RowsRead') ?? null,
      d1DurationMs: c.get('d1DurationMs') ?? null,
    }),
  );
};
