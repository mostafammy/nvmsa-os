# Core Authentication (`src/client/core/auth`)

## Overview
Manages client authentication session state, email/password sign-in and sign-out flows, development persona switching, and role-based UI gating.

## Interface
- `AuthProvider` (`[useSession.tsx:AuthProvider]`): Context provider supplying `{ user, isLoading, refreshSession, signIn, signOut, switchDevPersona }`.
- `useSession` (`[useSession.tsx:useSession]`): Hook returning the current `SessionContextValue`.
- `RoleGate` (`[RoleGate.tsx:RoleGate]`): Renders `children` when the user satisfies `minimumRole` via `hasMinimumRole`, or renders `fallback` (`null` by default).
- `SignInSheet` (`[SignInSheet.tsx:SignInSheet]`): `BottomSheet` dialog presenting either current user info with a Sign Out button or an email/password sign-in form.

## Invariants
- `[useSession.tsx:useSession]`: Throws `Error('useSession must be used inside AuthProvider')` if invoked outside `AuthProvider`.
- `[RoleGate.tsx:RoleGate]`: Defaults `effectiveRole` to `'officer'` when `user?.role` is undefined before checking `hasMinimumRole(effectiveRole, minimumRole)`.
- `[useSession.tsx:AuthProvider]`: Clears `setStoredDevPersona(null)` on `signIn` and `signOut`; if `refreshSession()` throws during `apiClient.api.me.$get()`, falls back to `getStoredDevPersona()` (synthesizing `email` as `${devPersona.role}@nvmsa.local`) or `null`.
- `[SignInSheet.tsx:SignInSheet]`: Trims `email` prior to calling `signIn` and enforces form constraints (`required` email and password, `minLength={8}` on password).

## Side Effects
- `[useSession.tsx:AuthProvider]`: Runs `refreshSession()` on mount via `useEffect` (`GET` via `apiClient.api.me.$get()`), issues `fetch('/api/auth/sign-in/email', { method: 'POST', credentials: 'include' })` in `signIn`, issues `fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })` in `signOut`, mutates `localStorage` dev persona via `setStoredDevPersona`, updates `user`/`isLoading` state, and invalidates all React Query caches via `queryClient.invalidateQueries()`.
- `[SignInSheet.tsx:SignInSheet]`: Updates local form/error/submitting state, triggers `signIn` or `signOut`, and calls `onClose()`.

## Verification
- Run: `pnpm test`
