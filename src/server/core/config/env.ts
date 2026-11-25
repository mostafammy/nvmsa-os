import type { D1Database } from '@cloudflare/workers-types';
import type { SessionUser } from '@shared/types';

export interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  APP_ENV?: 'development' | 'staging' | 'production';
  APP_TIMEZONE?: string;
}

export interface AppVariables {
  user: SessionUser | null;
  requestId: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
