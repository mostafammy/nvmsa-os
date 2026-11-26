# App Layout (`src/client/app/layout`)

## Overview
Provides the mobile-first application shell chrome for NVMSA OS, combining a sticky safe-area top header, routed main content outlet, and fixed bottom module navigation bar.

## Interface
- `BottomNav` (`[BottomNav.tsx:BottomNav]`): Renders a fixed bottom `<nav>` bar with `NavLink` items for each entry in `OS_MODULES`.
- `MobileShell` (`[MobileShell.tsx:MobileShell]`): Composes `SafeAreaHeader`, a `<main>` container rendering React Router's `<Outlet />`, and `BottomNav`, passing the active module's name and description to the header.
- `SafeAreaHeader` (`[SafeAreaHeader.tsx:SafeAreaHeader]`): Renders a sticky top `<header>` with `title`, optional `subtitle`, a `DEV`-only role switcher, and a Sign In / active role button that opens `SignInSheet`.

## Invariants
- `[MobileShell.tsx:MobileShell]`: Resolves `activeModule` via `OS_MODULES.find((mod) => pathname.startsWith(mod.route)) ?? OS_MODULES[0]`, guaranteeing fallback metadata from the first registered module when the path does not match a module prefix.
- `[BottomNav.tsx:BottomNav]`: Arranges `OS_MODULES` inside a 3-column grid (`grid-cols-3`) fixed to the bottom safe area.
- `[SafeAreaHeader.tsx:SafeAreaHeader]`: Defaults the dev-mode role selector value to `'officer'` when `user?.role` is absent and renders the role selector only when `import.meta.env.DEV` is truthy.

## Side Effects
- `[SafeAreaHeader.tsx:SafeAreaHeader]`: Calls `switchDevPersona(null)` or `switchDevPersona(...)` via `useSession()` when changing the development role selector, and toggles local `authSheetOpen` state to show or hide `SignInSheet`.

## Verification
- Run: `pnpm test`
