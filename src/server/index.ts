import { Hono } from 'hono';
import { createAuth } from './core/auth/auth';
import { sessionMiddleware } from './core/auth/session';
import type { AppEnv } from './core/config/env';
import { errorHandler } from './core/middleware/error-handler';
import { requestLogger } from './core/middleware/request-logger';
import { calendarRoutes } from './modules/calendar';

const api = new Hono<AppEnv>()
  .get('/health', (c) =>
    c.json({
      status: 'ok',
      service: 'nvmsa-os',
      timezone: c.env.APP_TIMEZONE ?? 'Africa/Cairo',
    }),
  )
  .get('/me', (c) => c.json({ user: c.get('user') }))
  .on(['POST', 'GET'], '/auth/*', (c) => {
    const auth = createAuth(c.env);
    return auth.handler(c.req.raw);
  })
  .route('/calendar', calendarRoutes);

const app = new Hono<AppEnv>()
  .use('/api/*', requestLogger)
  .use('/api/*', sessionMiddleware)
  .route('/api', api);

app.onError(errorHandler);

export type AppType = typeof app;

export default app;
