# public

## Overview
Provides the browser Service Worker (`sw.js`) in the public static directory for NVMSA OS. It pre-caches the core app shell (`'/'` and `'/manifest.webmanifest'`) on installation, deletes outdated Cache Storage buckets on activation, and implements a network-first fetch handler with Cache Storage fallback for non-API `GET` requests.

## Interface
- `[sw.js:CACHE_NAME]`: `const CACHE_NAME = 'nvmsa-os-v1'` — Cache Storage bucket name used for pre-caching and runtime caching.
- `[sw.js:APP_SHELL]`: `const APP_SHELL = ['/', '/manifest.webmanifest']` — static URLs pre-cached during Service Worker installation.
- `[sw.js:install]`: `self.addEventListener('install', (event) => ...)` — opens `CACHE_NAME`, caches all `APP_SHELL` URLs via `event.waitUntil(...)`, and invokes `self.skipWaiting()`.
- `[sw.js:activate]`: `self.addEventListener('activate', (event) => ...)` — deletes all Cache Storage keys other than `CACHE_NAME` via `event.waitUntil(...)` and invokes `self.clients.claim()`.
- `[sw.js:fetch]`: `self.addEventListener('fetch', (event) => ...)` — intercepts `GET` requests whose `new URL(request.url).pathname` does not start with `'/api/'` using `event.respondWith(...)` (network-first with `caches.match(request)` fallback).
- Subdirectories: None (no child contract directories; static non-code assets omitted except `'/'` and `'/manifest.webmanifest'` referenced in `sw.js`).

## Invariants
- `[sw.js:CACHE_NAME]`, `[sw.js:activate]`: Only Cache Storage key `'nvmsa-os-v1'` (`CACHE_NAME`) is retained after activation; every key with `key !== CACHE_NAME` is deleted.
- `[sw.js:APP_SHELL]`, `[sw.js:install]`: Installation waits via `event.waitUntil(...)` until `cache.addAll(APP_SHELL)` caches `'/'` and `'/manifest.webmanifest'` into `CACHE_NAME`.
- `[sw.js:fetch]`: Requests with `request.method !== 'GET'` or `new URL(request.url).pathname.startsWith('/api/')` return early without calling `event.respondWith(...)`, leaving them uncached and handled directly by the browser/network.
- `[sw.js:fetch]`: Eligible `GET` requests always attempt `fetch(request)` first and only consult `caches.match(request)` if `fetch(request)` rejects.
- `[sw.js:fetch]`: Successful network responses are cloned via `response.clone()` into `copy` before returning `response` to `event.respondWith(...)` and storing `copy` in `CACHE_NAME`.

## Side Effects
- `[sw.js:install]`, `[sw.js:CACHE_NAME]`, `[sw.js:APP_SHELL]`: Opens Cache Storage bucket `'nvmsa-os-v1'`, issues network requests to cache `'/'` and `'/manifest.webmanifest'` via `cache.addAll(APP_SHELL)`, and calls `self.skipWaiting()`.
- `[sw.js:activate]`, `[sw.js:CACHE_NAME]`: Reads `caches.keys()`, deletes all Cache Storage buckets where `key !== 'nvmsa-os-v1'` via `caches.delete(key)`, and calls `self.clients.claim()`.
- `[sw.js:fetch]`, `[sw.js:CACHE_NAME]`: For eligible non-`/api/` `GET` requests, executes `fetch(request)`, asynchronously opens `CACHE_NAME` to write `cache.put(request, copy)` on response resolution, or reads Cache Storage via `caches.match(request)` on network failure.

## Verification
- Run: `pnpm test`
