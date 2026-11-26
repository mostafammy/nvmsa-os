# Core Storage (`src/client/core/storage`)

## Overview
Provides a lightweight `localStorage` stale-while-revalidate (SWR) JSON cache helper with configurable max-age expiration.

## Interface
- `readSwrCache` (`[cache.ts:readSwrCache]`): Reads cached value `T` for `key` if present and within `maxAgeMs` (default 12 hours: `1000 * 60 * 60 * 12`).
- `writeSwrCache` (`[cache.ts:writeSwrCache]`): Serializes `data` with a `Date.now()` timestamp into `localStorage`.

## Invariants
- `[cache.ts:readSwrCache]`: Prefixes keys with `'nvmsa_os_swr:'`, treats entries older than `maxAgeMs` (`Date.now() - envelope.updatedAt > maxAgeMs`) as expired and returns `undefined`, and catches JSON/storage errors to return `undefined`.
- `[cache.ts:writeSwrCache]`: Swallows `localStorage` write exceptions (such as quota errors in private browsing).

## Side Effects
- `[cache.ts:readSwrCache]`: Reads `localStorage` under `'nvmsa_os_swr:' + key` and calls `localStorage.removeItem` when an entry has expired.
- `[cache.ts:writeSwrCache]`: Writes JSON `{ updatedAt, data }` to `localStorage` under `'nvmsa_os_swr:' + key`.

## Verification
- Run: `pnpm test`
