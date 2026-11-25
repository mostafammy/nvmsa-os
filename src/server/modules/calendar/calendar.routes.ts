import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  CreateSlotInputSchema,
  RelocateSlotInputSchema,
  UpdateSlotInputSchema,
  YearMonthSchema,
} from '@shared/schemas';
import { getCurrentCairoMonth } from '@shared/utils';
import type { AppEnv } from '../../core/config/env';
import { createDb } from '../../core/db/client';
import { requireRole } from '../../core/middleware/require-role';
import { defaultCalendarPolicy } from './calendar.policy';
import { D1SlotRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';

// Per-request DIP factory (stateless on Cloudflare Workers)
function createCalendarService(d1: D1Database): CalendarService {
  const db = createDb(d1);
  const repo = new D1SlotRepository(db);
  return new CalendarService(repo, defaultCalendarPolicy);
}

const monthQuerySchema = z.object({
  month: YearMonthSchema.optional(),
});

export const calendarRoutes = new Hono<AppEnv>()
  .get('/slots', zValidator('query', monthQuerySchema), async (c) => {
    const { month } = c.req.valid('query');
    const resolvedMonth = month ?? getCurrentCairoMonth();
    const service = createCalendarService(c.env.DB);
    const data = await service.listMonth(resolvedMonth, c.get('user'));
    return c.json(data);
  })
  .post('/slots', requireRole('eb'), zValidator('json', CreateSlotInputSchema), async (c) => {
    const input = c.req.valid('json');
    const service = createCalendarService(c.env.DB);
    const created = await service.bookSlot(input, c.get('user'));
    return c.json({ slot: created }, 201);
  })
  .patch('/slots/:id', requireRole('eb'), zValidator('json', UpdateSlotInputSchema), async (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');
    const service = createCalendarService(c.env.DB);
    const updated = await service.updateSlot(id, input, c.get('user'));
    return c.json({ slot: updated });
  })
  .post(
    '/slots/:id/relocate',
    requireRole('eb'),
    zValidator('json', RelocateSlotInputSchema),
    async (c) => {
      const id = c.req.param('id');
      const input = c.req.valid('json');
      const service = createCalendarService(c.env.DB);
      const relocated = await service.relocateSlot(id, input, c.get('user'));
      return c.json({ slot: relocated });
    },
  )
  .delete('/slots/:id', requireRole('eb'), async (c) => {
    const id = c.req.param('id');
    const service = createCalendarService(c.env.DB);
    const cancelled = await service.cancelSlot(id, c.get('user'));
    return c.json({ slot: cancelled });
  });
