import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Env } from '../config/env';
import { createDb } from '../db/client';
import * as schema from '../db/schema';

const MIN_SECRET_LENGTH = 32;

function resolveAuthSecret(env: Env): string {
  const secret = env.BETTER_AUTH_SECRET?.trim();
  if (secret && secret.length >= MIN_SECRET_LENGTH) {
    return secret;
  }

  if (env.APP_ENV === 'development') {
    return 'local-dev-only-secret-do-not-use-in-production-32+';
  }

  throw new Error(
    `[NVMSA OS] BETTER_AUTH_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters in ${env.APP_ENV ?? 'production'}.`,
  );
}

export function createAuth(env: Env) {
  const db = createDb(env.DB);
  const secret = resolveAuthSecret(env);

  return betterAuth({
    secret,
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
