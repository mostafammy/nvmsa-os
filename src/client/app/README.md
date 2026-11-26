# Client Application Shell (`src/client/app`)

## Overview
Defines the top-level React application composition for NVMSA OS, including global context providers (React Query, authentication session, and toasts), declarative module registration, client-side routing, and the mobile shell layout subpackage.

## Interface
- `App` (`[App.tsx:App]`): Root component wrapping `AppRouter` inside `AppProviders`.
- `OsModuleDefinition` (`[modules.registry.ts:OsModuleDefinition]`): Type contract for registered OS modules (`id`, `name`, `shortLabel`, `route`, `icon`, `status`, `description`, optional lazy `component`).
- `OS_MODULES` (`[modules.registry.ts:OS_MODULES]`): Readonly registry array defining active (`calendar`) and planned (`activities`, `recruitment`) modules.
- `AppProviders` (`[providers.tsx:AppProviders]`): Provider stack nesting `QueryClientProvider`, `AuthProvider`, and internal `ToastProvider`.
- `useToast` (`[providers.tsx:useToast]`): Hook returning `{ pushToast }` from `ToastContext`.
- `AppRouter` (`[router.tsx:AppRouter]`): Configures `BrowserRouter` routes inside `MobileShell`, mapping `OS_MODULES` entries to `<Suspense>`-wrapped lazy components or `PlannedModulePlaceholder`.
- Subdirectories:
  - [App Layout](./layout/README.md): Exports `BottomNav`, `MobileShell`, and `SafeAreaHeader`.

## Invariants
- `[providers.tsx:useToast]`: Throws `Error('useToast must be used inside AppProviders')` when invoked outside `ToastProvider`.
- `[providers.tsx:queryClient]`: Configures default React Query options with `staleTime: 30_000` and `retry: 1`.
- `[router.tsx:AppRouter]`: Redirects `/` and catch-all `*` routes to `/calendar` (`replace`), wraps all routes in `MobileShell`, and falls back to `PlannedModulePlaceholder` when `mod.component` is omitted.
- `[modules.registry.ts:OS_MODULES]`: Code-splits the active calendar page via React `lazy()` (`LazyCalendarPage`) importing `CalendarPage` from `../modules/calendar`.

## Side Effects
- `[providers.tsx:ToastProvider]`: Calls `crypto.randomUUID().slice(0, 8)`, mutates React `toasts` state, renders a fixed bottom toast stack (`bottom-20 z-50`), and registers a `window.setTimeout(..., 3500)` timer to dismiss each toast.
- `[modules.registry.ts:LazyCalendarPage]`: Performs a dynamic module import of `../modules/calendar` when `/calendar` is rendered.

## Verification
- Run: `pnpm test`
