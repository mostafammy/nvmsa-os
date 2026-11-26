import type { MiddlewareHandler } from 'hono';
import type { SeatCapabilities } from '@shared/constants';
import type { AppEnv } from '../config/env';
import { ForbiddenError, UnauthorizedError } from '../errors/domain-errors';

export function requireSeat(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (c.get('authOutcome') === 'seat_revoked') {
      throw new ForbiddenError(
        'Your NVMSA official seat has been reassigned or deactivated. Please sign in with the active seat Google account.',
      );
    }

    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Sign in with an official NVMSA Google account to continue');
    }

    await next();
  };
}

export function requireCapability(capability: keyof SeatCapabilities): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (c.get('authOutcome') === 'seat_revoked') {
      throw new ForbiddenError(
        'Your NVMSA official seat has been reassigned or deactivated. Please sign in with the active seat Google account.',
      );
    }

    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Sign in with an official NVMSA Google account to continue');
    }

    if (!user.capabilities[capability]) {
      throw new ForbiddenError(`Missing required capability: ${capability}`);
    }

    await next();
  };
}
