## Summary

- **Module**: `calendar` / `shell` / `shared` / `core`
- **What changed**:

## Architecture & Boundary Checklist

- [ ] `src/shared/` has zero React, Hono, or Drizzle imports
- [ ] `src/client/` imports no runtime code from `src/server/` (type-only `AppType` allowed)
- [ ] Module boundaries respected (cross-module imports go through `index.ts` only)
- [ ] New D1 schema changes include a version-controlled migration in `drizzle/`

## Verification

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] Tested on mobile viewport (safe-area + bottom navigation)
