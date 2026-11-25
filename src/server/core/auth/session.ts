import type { MiddlewareHandler } from 'hono';
import { NVMSA_ENTITY_CODES, USER_ROLES, type NvmsaEntityCode, type UserRole } from '@shared/constants';
import type { SessionUser } from '@shared/types';
import type { AppEnv } from '../config/env';
import { createAuth } from './auth';

function parseRole(value: unknown): UserRole {
  if (typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)) {
    return value as UserRole;
  }
  return 'officer';
}

function parseEntityCode(value: unknown): NvmsaEntityCode | null {
  if (typeof value === 'string' && (NVMSA_ENTITY_CODES as readonly string[]).includes(value)) {
    return value as NvmsaEntityCode;
  }
  return null;
}

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Development persona switcher header (disabled outside development)
  if (c.env.APP_ENV === 'development') {
    const devRole = c.req.header('x-dev-role');
    if (devRole) {
      const role = parseRole(devRole);
      const devUserId = c.req.header('x-dev-user-id') || `dev-${role}`;
      const devUserName =
        c.req.header('x-dev-user-name') ||
        (role === 'admin' ? 'NVMSA Admin' : role === 'eb' ? 'EB Member' : 'NVMSA Officer');
      const devEntity = parseEntityCode(c.req.header('x-dev-entity'));

      c.set('user', {
        id: devUserId,
        name: devUserName,
        email: `${role}@nvmsa.local`,
        role,
        entityCode: devEntity,
      });
      await next();
      return;
    }
  }

  try {
    const auth = createAuth(c.env);
    const result = await auth.api.getSession({ headers: c.req.raw.headers });
    if (result?.user) {
      const rawUser = result.user as Record<string, unknown>;
      const sessionUser: SessionUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: parseRole(rawUser.role),
        entityCode: parseEntityCode(rawUser.entityCode),
      };
      c.set('user', sessionUser);
    } else {
      c.set('user', null);
    }
  } catch {
    c.set('user', null);
  }

  await next();
};
