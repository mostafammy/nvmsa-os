import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Env } from '../config/env';
import { createDb } from '../db/client';
import * as schema from '../db/schema';

export function createAuth(env: Env) {
  const db = createDb(env.DB);

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET || 'dev-only-secret-change-in-production',
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'officer',
        },
        entityCode: {
          type: 'string',
          required: false,
        },
      },
    },
  });
}
