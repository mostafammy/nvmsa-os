import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../config/env';
import { ForbiddenError } from '../errors/domain-errors';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

const CSP_HEADER_VALUE = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
].join('; ');

function resolveExpectedOrigins(requestUrl: string, authBaseUrl?: string): Set<string> {
  const origins = new Set<string>();
  try {
    origins.add(new URL(requestUrl).origin);
  } catch {
    // Ignore invalid request URLs in test environments
  }
  if (authBaseUrl) {
    try {
      origins.add(new URL(authBaseUrl).origin);
    } catch {
      // Ignore malformed env URL
    }
  }
  return origins;
}

export const securityHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (MUTATING_METHODS.has(c.req.method) && c.req.path.startsWith('/api/v1/')) {
    const originHeader = c.req.header('origin');
    if (originHeader) {
      const allowedOrigins = resolveExpectedOrigins(c.req.url, c.env.BETTER_AUTH_URL);
      if (!allowedOrigins.has(originHeader)) {
        throw new ForbiddenError('Cross-origin mutation rejected');
      }
    }
  }

  await next();

  c.header('Content-Security-Policy', CSP_HEADER_VALUE);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
};
