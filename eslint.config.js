import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['dist', '.wrangler', 'node_modules', 'drizzle'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'hono', 'hono/*', 'drizzle-orm', 'drizzle-orm/*', '@client/*', '@server/*', '../client/*', '../server/*'],
              message: 'src/shared must remain pure TypeScript with zero React, Hono, Drizzle, client, or server imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/client/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@server/*', '../server/*', '../../server/*', '../../../server/*'],
              allowTypeImports: true,
              message: 'src/client cannot import runtime code from src/server (only `import type { AppType }` is allowed for Hono RPC).',
            },
            {
              group: ['@client/modules/*/*', '../modules/*/*', './modules/*/*'],
              message: 'Import from a module root index.ts barrel only — do not reach into another module’s internal files.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@server/modules/*', '../modules/*', '../../modules/*'],
              message: 'src/server/core must never import from src/server/modules (except the Drizzle schema registry).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/core/db/schema.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
