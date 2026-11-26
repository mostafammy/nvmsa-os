import type { D1Database } from '@cloudflare/workers-types';
import type { SeatSessionUser } from '@shared/types';

export interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SUPER_ADMIN_EMAIL: string;
  APP_ENV?: 'development' | 'staging' | 'production';
  APP_TIMEZONE?: string;
  TEST_AUTH_SECRET?: string;
}

export interface AppVariables {
  user: SeatSessionUser | null;
  requestId: string;
  authOutcome: 'public' | 'authenticated' | 'seat_revoked' | 'auth_error';
  telemetryOutcome?: string;
  telemetryOrgUnitId?: string;
  d1RowsRead?: number;
  d1DurationMs?: number;
}

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
