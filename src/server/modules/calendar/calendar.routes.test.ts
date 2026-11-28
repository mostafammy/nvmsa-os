import { describe, expect, it } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import app from '../../index';
import type { Env } from '../../core/config/env';

function createMockDb(unitCount = 11, seatCount = 13): D1Database {
  return {
    prepare(query: string) {
      return {
        bind() {
          return this;
        },
        async first<T>() {
          if (query.includes('org_units')) {
            return { count: unitCount } as T;
          }
          if (query.includes('office_seats')) {
            return { count: seatCount } as T;
          }
          return null;
        },
      };
    },
  } as unknown as D1Database;
}

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createMockDb(),
    BETTER_AUTH_SECRET: 'test-secret-with-at-least-thirty-two-characters',
    BETTER_AUTH_URL: 'https://nvmsa-os.example.workers.dev',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    SUPER_ADMIN_EMAIL: 'mostafa.yaser.developer@gmail.com',
    APP_ENV: 'production',
    APP_TIMEZONE: 'Africa/Cairo',
    ...overrides,
  };
}

describe('HTTP & Security Boundaries (app.request)', () => {
  it('verifies D1 readiness on /api/v1/health and emits full UUID X-Request-Id + CSP headers', async () => {
    const res = await app.request('/api/v1/health', {}, createMockEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Content-Security-Policy')).toContain("object-src 'none'");
    expect(res.headers.get('X-Request-Id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const unseeded = await app.request('/api/v1/health', {}, createMockEnv({ DB: createMockDb(0, 0) }));
    expect(unseeded.status).toBe(503);
  });

  it('ignores any x-dev-role impersonation headers and returns user=null without session cookie', async () => {
    const res = await app.request(
      '/api/v1/me',
      {
        headers: {
          'x-dev-role': 'admin',
          'x-dev-user-id': 'attacker',
        },
      },
      createMockEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: unknown; authOutcome: string };
    expect(body.user).toBeNull();
    expect(body.authOutcome).toBe('public');
  });

  it('rejects cross-origin mutations with 403', async () => {
    const res = await app.request(
      '/api/v1/calendar/slots',
      {
        method: 'POST',
        headers: {
          origin: 'https://evil-site.example',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      },
      createMockEnv(),
    );
    expect(res.status).toBe(403);
  });

  it('returns 401 on unauthenticated protected calendar and admin endpoints', async () => {
    const slotRes = await app.request(
      '/api/v1/calendar/slots',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          postDate: '2026-12-20',
          orgUnitId: 'SCOPH',
          contentType: 'POST',
          title: 'Unauthorized Post',
        }),
      },
      createMockEnv(),
    );
    expect(slotRes.status).toBe(401);

    const adminRes = await app.request('/api/v1/admin/seats', {}, createMockEnv());
    expect(adminRes.status).toBe(401);
  });

  it('fails closed cleanly with 400/401 when no valid session exists even on malformed query', async () => {
    const res = await app.request('/api/v1/calendar/month?ym=2026-13', {}, createMockEnv());
    expect(res.status).toBe(400);
  });

  it('redirects legacy calendar/admin/app/casing routes to /nvmsaOs and serves /nvmsaOs/ SPA shell', async () => {
    const calRes = await app.request('/calendar?ym=2026-12', {}, createMockEnv());
    expect(calRes.status).toBe(301);
    expect(calRes.headers.get('Location')).toMatch(/\/nvmsaOs\/calendar\?ym=2026-12$/);

    const adminRes = await app.request('/admin', {}, createMockEnv());
    expect(adminRes.status).toBe(301);
    expect(adminRes.headers.get('Location')).toMatch(/\/nvmsaOs\/admin$/);

    const appLegacyRes = await app.request('/app/calendar', {}, createMockEnv());
    expect(appLegacyRes.status).toBe(301);
    expect(appLegacyRes.headers.get('Location')).toMatch(/\/nvmsaOs\/calendar$/);

    const caseRes = await app.request('/nvmsaos/calendar', {}, createMockEnv());
    expect(caseRes.status).toBe(301);
    expect(caseRes.headers.get('Location')).toMatch(/\/nvmsaOs\/calendar$/);

    const arRes = await app.request('/ar', {}, createMockEnv());
    expect(arRes.status).toBe(301);
    expect(arRes.headers.get('Location')).toMatch(/\/ar\/$/);

    const fetchedUrls: string[] = [];
    const mockAssets = {
      async fetch(input: RequestInfo | URL) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        fetchedUrls.push(url);
        return new Response('<html><body>NVMSA OS</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      },
    } as unknown as Env['ASSETS'];

    const appRes = await app.request('/nvmsaOs/calendar', {}, createMockEnv({ ASSETS: mockAssets }));
    expect(appRes.status).toBe(200);
    expect(fetchedUrls[0]).toMatch(/\/nvmsaOs\/$/);
  });
});
