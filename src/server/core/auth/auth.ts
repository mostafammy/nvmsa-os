import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import type { Env } from '../config/env';
import { createDb } from '../db/client';
import * as schema from '../db/schema';
import { isEmailAllowlistedForSeat, normalizeEmail } from './seat-resolver';

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
    `[NVMSA OS] BETTER_AUTH_SECRET must be >= ${MIN_SECRET_LENGTH} chars in ${env.APP_ENV ?? 'production'}.`,
  );
}

function resolveAuthBaseUrl(env: Env): string {
  const url = env.BETTER_AUTH_URL?.trim();
  if (!url) {
    if (env.APP_ENV === 'development') {
      return 'http://localhost:5173';
    }
    throw new Error('[NVMSA OS] BETTER_AUTH_URL must be configured outside development.');
  }

  if (env.APP_ENV !== 'development' && !url.startsWith('https://')) {
    throw new Error('[NVMSA OS] BETTER_AUTH_URL must use https:// outside development.');
  }

  return url;
}

function resolveGoogleCredentials(env: Env): { clientId: string; clientSecret: string } {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error('[NVMSA OS] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
  }
  if (!env.SUPER_ADMIN_EMAIL?.trim()) {
    throw new Error('[NVMSA OS] SUPER_ADMIN_EMAIL is required.');
  }
  return { clientId, clientSecret };
}

export function createAuth(env: Env) {
  const db = createDb(env.DB);
  const secret = resolveAuthSecret(env);
  const baseURL = resolveAuthBaseUrl(env);
  const google = resolveGoogleCredentials(env);

  return betterAuth({
    secret,
    baseURL,
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
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId: google.clientId,
        clientSecret: google.clientSecret,
        prompt: 'select_account',
        scope: ['openid', 'email', 'profile'],
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!user.emailVerified) {
              throw new APIError('FORBIDDEN', {
                message: 'A verified Google account email is required.',
              });
            }

            const email = normalizeEmail(user.email);
            const allowed = await isEmailAllowlistedForSeat(db, env, email);
            if (!allowed) {
              throw new APIError('FORBIDDEN', {
                message: 'This Google account is not bound to an active NVMSA Official Seat.',
              });
            }

            return {
              data: {
                ...user,
                email,
              },
            };
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const [userRow] = await db
              .select({ email: schema.users.email, emailVerified: schema.users.emailVerified })
              .from(schema.users)
              .where(eq(schema.users.id, session.userId))
              .limit(1);

            if (!userRow || !userRow.emailVerified) {
              throw new APIError('FORBIDDEN', {
                message: 'Verified seat holder email required to open a session.',
              });
            }

            const allowed = await isEmailAllowlistedForSeat(db, env, userRow.email);
            if (!allowed) {
              throw new APIError('FORBIDDEN', {
                message: 'Your NVMSA official seat is inactive or reassigned.',
              });
            }
          },
        },
      },
    },
  });
}
