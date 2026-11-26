import type { D1Database } from '@cloudflare/workers-types';
import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  BookSlotInputSchema,
  CancelSlotInputSchema,
  OverrideSlotInputSchema,
  QueueRelocationInputSchema,
  RelocateSlotInputSchema,
  UpdateSlotInputSchema,
  YearMonthSchema,
} from '@shared/schemas';
import { getCurrentCairoMonth } from '@shared/utils';
import type { AppEnv } from '../../core/config/env';
import { createDb } from '../../core/db/client';
import { requireCapability, requireSeat } from '../../core/middleware/require-role';
import { defaultCalendarPolicy } from './calendar.policy';
import { D1SlotRepository } from './calendar.repository';
import { CalendarService, type MutationContext } from './calendar.service';

function createCalendarService(d1: D1Database): CalendarService {
  const db = createDb(d1);
  return new CalendarService(new D1SlotRepository(db, d1), defaultCalendarPolicy);
}

function getEdgeCache(): Cache | null {
  try {
    const cacheStorage = (
      globalThis as unknown as { caches?: CacheStorage & { default?: Cache } }
    ).caches;
    return cacheStorage?.default ?? null;
  } catch {
    return null;
  }
}

function scheduleBackground(c: Context<AppEnv>, work: Promise<unknown>): void {
  try {
    c.executionCtx.waitUntil(work.catch(() => undefined));
  } catch {
    // executionCtx unavailable in standalone Node tests
    void work.catch(() => undefined);
  }
}

function buildPublicMonthCacheKey(requestUrl: string, month: string): string {
  const url = new URL(requestUrl);
  url.pathname = '/api/v1/calendar/month';
  url.search = `?ym=${month}`;
  return url.toString();
}

function invalidateMonthEdgeCache(
  c: Context<AppEnv>,
  affectedMonths: string[],
): void {
  const cache = getEdgeCache();
  if (!cache || affectedMonths.length === 0) return;
  const tasks = affectedMonths.map((month) =>
    cache.delete(buildPublicMonthCacheKey(c.req.url, month)),
  );
  scheduleBackground(c, Promise.all(tasks));
}

function buildMutationContext(c: Context<AppEnv>, routeKey: string): MutationContext {
  const rawKey = c.req.header('idempotency-key')?.trim();
  return {
    requestId: c.get('requestId'),
    idempotencyKey: rawKey && rawKey.length > 0 ? rawKey : undefined,
    routeKey,
    scheduleBackground: (work) => scheduleBackground(c, work),
  };
}

const monthQuerySchema = z.object({
  ym: YearMonthSchema.optional(),
});

export const calendarRoutes = new Hono<AppEnv>()
  .get('/month', zValidator('query', monthQuerySchema), async (c) => {
    const { ym } = c.req.valid('query');
    const resolvedMonth = ym ?? getCurrentCairoMonth();
    const user = c.get('user');
    const cache = user === null ? getEdgeCache() : null;
    const cacheKey = cache ? buildPublicMonthCacheKey(c.req.url, resolvedMonth) : null;

    if (cache && cacheKey) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return new Response(cached.body, cached);
      }
    }

    const service = createCalendarService(c.env.DB);
    const data = await service.listMonth(resolvedMonth, user);
    const res = c.json(data);

    if (cache && cacheKey) {
      res.headers.set('Cache-Control', 'public, max-age=15, s-maxage=60');
      scheduleBackground(c, cache.put(cacheKey, res.clone()));
    } else if (user !== null) {
      res.headers.set('Cache-Control', 'private, no-store');
    }

    return res;
  })
  .get('/relocations', requireSeat(), async (c) => {
    const service = createCalendarService(c.env.DB);
    const items = await service.listRelocations(c.get('user'));
    c.header('Cache-Control', 'private, no-store');
    return c.json({ items });
  })
  .get('/slots/:id/history', requireSeat(), async (c) => {
    const id = c.req.param('id');
    const service = createCalendarService(c.env.DB);
    const history = await service.listSlotHistory(id, c.get('user'));
    return c.json({ history });
  })
  .post('/slots', requireSeat(), zValidator('json', BookSlotInputSchema), async (c) => {
    const input = c.req.valid('json');
    const service = createCalendarService(c.env.DB);
    const result = await service.bookSlot(
      input,
      c.get('user'),
      buildMutationContext(c, 'POST /slots'),
    );

    if ('replayed' in result) {
      c.set('telemetryOutcome', 'idempotency_replay');
      return c.json(result.body, result.statusCode as 201);
    }

    c.set('telemetryOutcome', 'committed');
    c.set('telemetryOrgUnitId', result.slot.orgUnitId);
    invalidateMonthEdgeCache(c, result.affectedMonths);
    return c.json(result, 201);
  })
  .patch('/slots/:id', requireSeat(), zValidator('json', UpdateSlotInputSchema), async (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');
    const service = createCalendarService(c.env.DB);
    const result = await service.updateSlot(
      id,
      input,
      c.get('user'),
      buildMutationContext(c, `PATCH /slots/${id}`),
    );

    if ('replayed' in result) {
      c.set('telemetryOutcome', 'idempotency_replay');
      return c.json(result.body, 200);
    }

    c.set('telemetryOutcome', 'committed');
    c.set('telemetryOrgUnitId', result.slot.orgUnitId);
    invalidateMonthEdgeCache(c, result.affectedMonths);
    return c.json(result);
  })
  .post(
    '/slots/:id/queue-relocation',
    requireSeat(),
    zValidator('json', QueueRelocationInputSchema),
    async (c) => {
      const id = c.req.param('id');
      const input = c.req.valid('json');
      const service = createCalendarService(c.env.DB);
      const result = await service.queueRelocation(
        id,
        input,
        c.get('user'),
        buildMutationContext(c, `POST /slots/${id}/queue-relocation`),
      );

      if ('replayed' in result) {
        c.set('telemetryOutcome', 'idempotency_replay');
        return c.json(result.body, 200);
      }

      c.set('telemetryOutcome', 'committed');
      c.set('telemetryOrgUnitId', result.slot.orgUnitId);
      invalidateMonthEdgeCache(c, result.affectedMonths);
      return c.json(result);
    },
  )
  .post(
    '/slots/:id/relocate',
    requireSeat(),
    zValidator('json', RelocateSlotInputSchema),
    async (c) => {
      const id = c.req.param('id');
      const input = c.req.valid('json');
      const service = createCalendarService(c.env.DB);
      const result = await service.relocateSlot(
        id,
        input,
        c.get('user'),
        buildMutationContext(c, `POST /slots/${id}/relocate`),
      );

      if ('replayed' in result) {
        c.set('telemetryOutcome', 'idempotency_replay');
        return c.json(result.body, 200);
      }

      c.set('telemetryOutcome', 'committed');
      c.set('telemetryOrgUnitId', result.slot.orgUnitId);
      invalidateMonthEdgeCache(c, result.affectedMonths);
      return c.json(result);
    },
  )
  .post(
    '/slots/override',
    requireCapability('canMutateAnySlot'),
    zValidator('json', OverrideSlotInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const service = createCalendarService(c.env.DB);
      const result = await service.overrideSlot(
        input,
        c.get('user'),
        buildMutationContext(c, 'POST /slots/override'),
      );

      if ('replayed' in result) {
        c.set('telemetryOutcome', 'idempotency_replay');
        return c.json(result.body, result.statusCode as 200 | 201);
      }

      c.set('telemetryOutcome', 'committed');
      c.set('telemetryOrgUnitId', result.slot.orgUnitId);
      invalidateMonthEdgeCache(c, result.affectedMonths);
      return c.json(result, result.displacedSlot ? 200 : 201);
    },
  )
  .delete(
    '/slots/:id',
    requireSeat(),
    zValidator('json', CancelSlotInputSchema),
    async (c) => {
      const id = c.req.param('id');
      const input = c.req.valid('json');
      const service = createCalendarService(c.env.DB);
      const result = await service.cancelSlot(
        id,
        input,
        c.get('user'),
        buildMutationContext(c, `DELETE /slots/${id}`),
      );

      if ('replayed' in result) {
        c.set('telemetryOutcome', 'idempotency_replay');
        return c.json(result.body, 200);
      }

      c.set('telemetryOutcome', 'committed');
      c.set('telemetryOrgUnitId', result.slot.orgUnitId);
      invalidateMonthEdgeCache(c, result.affectedMonths);
      return c.json(result);
    },
  );
