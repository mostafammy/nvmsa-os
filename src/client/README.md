# Client Frontend (`src/client`)

## Overview
Browser entry point for the NVMSA OS React PWA, booting `<App />` into `#root`, registering the production service worker, and organizing the frontend into application shell, core infrastructure, feature modules, and shared UI primitives.

## Interface
- Entrypoint (`[main.tsx]`): No exported symbols; top-level browser bootstrap mounting `<StrictMode><App /></StrictMode>` onto `#root`.
- Subdirectories:
  - [Client Application Shell](./app/README.md): Exposes `App`, `AppProviders`, `useToast`, `AppRouter`, `OS_MODULES`, `OsModuleDefinition`, and shell layout components.
  - [Core Infrastructure](./core/README.md): Groups typed API client (`./core/api/README.md`), authentication (`./core/auth/README.md`), and SWR cache storage (`./core/storage/README.md`).
  - [Client Feature Modules](./modules/README.md): Groups vertical feature modules starting with the Content Calendar (`./modules/calendar/README.md`).
  - [Shared UI Primitives](./ui/README.md): Exposes `Badge`, `BottomSheet`, and `Button`.

## Invariants
- `[main.tsx:rootElement]`: Requires a DOM element with ID `'root'`; throws `Error('Root element #root not found')` if `document.getElementById('root')` returns `null`.
- `[main.tsx]`: Registers `/sw.js` only when `'serviceWorker' in navigator && import.meta.env.PROD` is true.

## Side Effects
- `[main.tsx]`: Mounts the React tree into `document.getElementById('root')` via `createRoot(rootElement).render(...)` and wraps `<App />` in `StrictMode`.
- `[main.tsx]`: In production builds with `navigator.serviceWorker` support, attaches a `window` `'load'` event listener that calls `navigator.serviceWorker.register('/sw.js')` and logs registration failures via `console.warn`.

## Verification
- Run: `pnpm test`
