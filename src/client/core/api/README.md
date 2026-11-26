# Core API Client (`src/client/core/api`)

## Overview
Configures the typed Hono RPC client used across the frontend and manages `localStorage`-backed development persona headers for local role testing.

## Interface
- `DevPersona` (`[client.ts:DevPersona]`): Exported interface `{ role: 'officer' | 'eb' | 'admin'; userId: string; userName: string; entityCode: string }`.
- `getStoredDevPersona` (`[client.ts:getStoredDevPersona]`): Reads and parses the `DevPersona` stored under `'nvmsa_os_dev_persona'`.
- `setStoredDevPersona` (`[client.ts:setStoredDevPersona]`): Persists or clears the `'nvmsa_os_dev_persona'` entry.
- `apiClient` (`[client.ts:apiClient]`): Typed Hono client (`hc<AppType>('/')`) configured with dynamic request headers.

## Invariants
- `[client.ts:getStoredDevPersona]`, `[client.ts:setStoredDevPersona]`: Both are no-ops (`null` / `void`) unless `import.meta.env.DEV` is truthy; `getStoredDevPersona` catches JSON/storage exceptions and returns `null`.
- `[client.ts:apiClient]`: Attaches `x-dev-role`, `x-dev-user-id`, `x-dev-user-name`, and `x-dev-entity` headers only when `getStoredDevPersona()` returns a non-null persona.

## Side Effects
- `[client.ts:getStoredDevPersona]`: Reads `localStorage` key `'nvmsa_os_dev_persona'` in `DEV` mode.
- `[client.ts:setStoredDevPersona]`: Calls `localStorage.setItem` or `localStorage.removeItem` on `'nvmsa_os_dev_persona'` in `DEV` mode.
- `[client.ts:apiClient]`: Performs HTTP requests rooted at `/` via `hono/client` when callers invoke endpoint methods.

## Verification
- Run: `pnpm test`
