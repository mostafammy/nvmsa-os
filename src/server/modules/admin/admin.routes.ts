import type { D1Database } from '@cloudflare/workers-types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  PatchOrgUnitInputSchema,
  UpdateSeatInputSchema,
  UpsertOrgUnitInputSchema,
} from '@shared/schemas';
import type { AppEnv } from '../../core/config/env';
import { createDb } from '../../core/db/client';
import { requireCapability } from '../../core/middleware/require-role';
import { D1AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';

function createAdminService(d1: D1Database): AdminService {
  const db = createDb(d1);
  return new AdminService(new D1AdminRepository(db));
}

export const adminRoutes = new Hono<AppEnv>()
  .get('/seats', requireCapability('canManageSeats'), async (c) => {
    const service = createAdminService(c.env.DB);
    const seats = await service.listSeats(c.get('user'));
    return c.json({ seats });
  })
  .patch(
    '/seats/:seatCode',
    requireCapability('canManageSeats'),
    zValidator('json', UpdateSeatInputSchema),
    async (c) => {
      const seatCode = decodeURIComponent(c.req.param('seatCode'));
      const input = c.req.valid('json');
      const service = createAdminService(c.env.DB);
      const seat = await service.updateSeat(seatCode, input, c.get('user'), c.get('requestId'));
      c.set('telemetryOutcome', 'committed');
      return c.json({ seat });
    },
  )
  .get('/org-units', requireCapability('canManageOrgUnits'), async (c) => {
    const service = createAdminService(c.env.DB);
    const orgUnits = await service.listOrgUnits(c.get('user'));
    return c.json({ orgUnits });
  })
  .post(
    '/org-units',
    requireCapability('canManageOrgUnits'),
    zValidator('json', UpsertOrgUnitInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const service = createAdminService(c.env.DB);
      const orgUnit = await service.createOrgUnit(input, c.get('user'), c.get('requestId'));
      c.set('telemetryOutcome', 'committed');
      c.set('telemetryOrgUnitId', orgUnit.id);
      return c.json({ orgUnit }, 201);
    },
  )
  .patch(
    '/org-units/:id',
    requireCapability('canManageOrgUnits'),
    zValidator('json', PatchOrgUnitInputSchema),
    async (c) => {
      const id = decodeURIComponent(c.req.param('id'));
      const input = c.req.valid('json');
      const service = createAdminService(c.env.DB);
      const orgUnit = await service.updateOrgUnit(id, input, c.get('user'), c.get('requestId'));
      c.set('telemetryOutcome', 'committed');
      c.set('telemetryOrgUnitId', orgUnit.id);
      return c.json({ orgUnit });
    },
  );
