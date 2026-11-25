import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../config/env';

export const requestLogger: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  c.set('requestId', requestId);
  const start = Date.now();

  await next();

  const durationMs = Date.now() - start;
  console.log(
    JSON.stringify({
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
    }),
  );
};
