import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/core/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
});
