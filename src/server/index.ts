import { Hono } from 'hono';
import { createAuth } from './core/auth/auth';
import { sessionMiddleware } from './core/auth/session';
import type { AppEnv } from './core/config/env';
import { errorHandler } from './core/middleware/error-handler';
import { requestLogger } from './core/middleware/request-logger';
import { securityHeaders } from './core/middleware/security-headers';
import { adminRoutes } from './modules/admin';
import { calendarRoutes } from './modules/calendar';

const apiV1 = new Hono<AppEnv>()
  .get('/health', async (c) => {
    try {
      const [unitCheck, seatCheck] = await Promise.all([
        c.env.DB.prepare('SELECT COUNT(*) AS count FROM org_units WHERE is_active = 1').first<{
          count: number;
        }>(),
        c.env.DB.prepare('SELECT COUNT(*) AS count FROM office_seats WHERE is_active = 1').first<{
          count: number;
        }>(),
      ]);

      const unitCount = Number(unitCheck?.count ?? 0);
      const seatCount = Number(seatCheck?.count ?? 0);
      if (unitCount === 0 || seatCount === 0) {
        return c.json(
          {
            status: 'unseeded',
            service: 'nvmsa-os',
            unitCount,
            seatCount,
          },
          503,
        );
      }

      return c.json({
        status: 'ok',
        service: 'nvmsa-os',
        timezone: c.env.APP_TIMEZONE ?? 'Africa/Cairo',
        unitCount,
        seatCount,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'health_check_failed',
          requestId: c.get('requestId'),
          message: error instanceof Error ? error.message : 'Unknown D1 error',
        }),
      );
      return c.json({ status: 'error', service: 'nvmsa-os' }, 503);
    }
  })
  .get('/me', (c) => {
    c.header('Cache-Control', 'private, no-store');
    return c.json({ user: c.get('user'), authOutcome: c.get('authOutcome') });
  })
  .route('/calendar', calendarRoutes)
  .route('/admin', adminRoutes);

const app = new Hono<AppEnv>()
  .use('/api/*', securityHeaders)
  .use('/api/*', requestLogger)
  .use('/api/v1/*', sessionMiddleware)
  .on(['POST', 'GET'], '/api/auth/*', (c) => {
    const auth = createAuth(c.env);
    return auth.handler(c.req.raw);
  })
  .route('/api/v1', apiV1)
  .get('*', async (c) => {
    if (c.env.ASSETS) {
      const assetRes = await c.env.ASSETS.fetch(c.req.url);
      return assetRes as unknown as Response;
    }
    return c.notFound();
  });

app.onError(errorHandler);

export type AppType = typeof app;

export default app;
