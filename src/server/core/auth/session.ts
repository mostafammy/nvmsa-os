import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../config/env';
import { createDb } from '../db/client';
import { createAuth } from './auth';
import { resolveSeatUser } from './seat-resolver';

const SESSION_COOKIE_PATTERN = /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/;

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const cookieHeader = c.req.header('cookie') ?? '';
  if (!SESSION_COOKIE_PATTERN.test(cookieHeader)) {
    c.set('user', null);
    c.set('authOutcome', 'public');
    await next();
    return;
  }

  try {
    const auth = createAuth(c.env);
    const result = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!result?.user) {
      c.set('user', null);
      c.set('authOutcome', 'public');
      await next();
      return;
    }

    const db = createDb(c.env.DB);
    const seatUser = await resolveSeatUser(db, c.env, {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    });

    if (!seatUser) {
      c.set('user', null);
      c.set('authOutcome', 'seat_revoked');
      await next();
      return;
    }

    c.set('user', seatUser);
    c.set('authOutcome', 'authenticated');
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'auth_session_error',
        requestId: c.get('requestId'),
        message: error instanceof Error ? error.message : 'Unknown session error',
      }),
    );
    c.set('user', null);
    c.set('authOutcome', 'auth_error');
  }

  await next();
};
