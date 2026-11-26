# Core Infrastructure (`src/client/core`)

## Overview
Groups shared client infrastructure subpackages for typed backend RPC communication, authentication session management and role gating, and browser cache persistence.

## Subdirectories & Boundaries
- Core API Client: [./api/README.md](./api/README.md) - Exposes `apiClient` (`hc<AppType>('/')`) and `DEV`-only `localStorage` persona header helpers (`getStoredDevPersona`, `setStoredDevPersona`).
- Core Authentication: [./auth/README.md](./auth/README.md) - Exposes `AuthProvider`, `useSession`, `RoleGate`, and `SignInSheet` for session lifecycle, sign-in/out requests, and role gating.
- Core Storage: [./storage/README.md](./storage/README.md) - Exposes `readSwrCache` and `writeSwrCache` for TTL-bounded `localStorage` caching.
