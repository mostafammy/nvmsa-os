import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import app from '../../index';
import type { Env } from '../../core/config/env';

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    BETTER_AUTH_SECRET: 'test-secret-with-at-least-thirty-two-characters',
    BETTER_AUTH_URL: 'http://localhost:5173',
    APP_ENV: 'production',
    ALLOW_DEV_IMPERSONATION: 'false',
    APP_TIMEZONE: 'Africa/Cairo',
    ...overrides,
  };
}

describe('HTTP & Security Boundaries (app.request)', () => {
  it('returns service health metadata', async () => {
    const res = await app.request('/api/health', {}, createMockEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; timezone: string };
    expect(body.status).toBe('ok');
    expect(body.timezone).toBe('Africa/Cairo');
  });

  it('ignores x-dev-role impersonation headers in production (fail-closed)', async () => {
    const res = await app.request(
      '/api/me',
      {
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': 'attacker',
        },
      },
      createMockEnv({ APP_ENV: 'production', ALLOW_DEV_IMPERSONATION: 'false' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: unknown };
    expect(body.user).toBeNull();
  });

  it('returns 401 when an unauthenticated caller attempts to book a slot', async () => {
    const res = await app.request(
      '/api/calendar/slots',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          postDate: '2026-12-20',
          title: 'Unauthorized Post',
          entityCode: 'SCOPH',
          format: 'poster',
        }),
      },
      createMockEnv(),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when an Officer attempts to book a slot', async () => {
    const res = await app.request(
      '/api/calendar/slots',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-dev-role': 'officer',
        },
        body: JSON.stringify({
          postDate: '2026-12-20',
          title: 'Officer Post Attempt',
          entityCode: 'SCOPH',
          format: 'poster',
        }),
      },
      createMockEnv({ APP_ENV: 'development', ALLOW_DEV_IMPERSONATION: 'true' }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 400 when Zod validation fails on malformed slot payload', async () => {
    const res = await app.request(
      '/api/calendar/slots',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-dev-role': 'eb',
        },
        body: JSON.stringify({
          postDate: 'not-a-date',
          title: 'Hi',
          entityCode: 'INVALID',
        }),
      },
      createMockEnv({ APP_ENV: 'development', ALLOW_DEV_IMPERSONATION: 'true' }),
    );
    expect(res.status).toBe(400);
  });
});
