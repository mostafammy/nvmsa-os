import type { MiddlewareHandler } from 'hono';
import { hasMinimumRole, type UserRole } from '@shared/constants';
import type { AppEnv } from '../config/env';
import { ForbiddenError, UnauthorizedError } from '../errors/domain-errors';

export function requireRole(minimumRole: UserRole): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Sign in to access this action');
    }
    if (!hasMinimumRole(user.role, minimumRole)) {
      throw new ForbiddenError(`Requires ${minimumRole} role or higher`);
    }
    await next();
  };
}
