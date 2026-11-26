# Shared UI Primitives (`src/client/ui`)

## Overview
Provides reusable Tailwind-styled UI primitive components (`Badge`, `BottomSheet`, `Button`) shared across the application shell, auth flows, and feature modules.

## Interface
- `Badge` (`[Badge.tsx:Badge]`): Inline pill `<span>` displaying `children` with optional `className`.
- `BottomSheet` (`[BottomSheet.tsx:BottomSheet]`): Responsive modal dialog (`role="dialog"`, `aria-modal="true"`) rendering a bottom sheet on mobile and centered modal on desktop with `title`, optional `subtitle`, `onClose`, and scrollable `children`.
- `Button` (`[Button.tsx:Button]`): `<button>` primitive supporting `variant` (`'primary' | 'secondary' | 'danger' | 'ghost'`), `size` (`'sm' | 'md'`), and standard `ButtonHTMLAttributes<HTMLButtonElement>`.

## Invariants
- `[BottomSheet.tsx:BottomSheet]`: Returns `null` when `!open`; prevents backdrop click dismissal from bubbling when clicking inside the dialog surface (`event.stopPropagation()`); binds the `Escape` key handler only while `open` is true.
- `[Button.tsx:Button]`: Defaults `variant` to `'primary'`, `size` to `'md'`, and `type` to `'button'` to prevent accidental form submissions.
- `[Badge.tsx:Badge]`: Falls back to `'bg-slate-100 text-slate-700 border-slate-200'` when `className` is omitted.

## Side Effects
- `[BottomSheet.tsx:BottomSheet]`: Registers and cleans up a `window` `'keydown'` listener in `useEffect` and invokes `onClose` on `Escape`, backdrop click, or close button click.

## Verification
- Run: `pnpm test`
