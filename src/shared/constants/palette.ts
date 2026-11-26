/**
 * Closed 12-token WCAG AA accent palette.
 * Using pre-compiled static Tailwind classes guarantees dynamic D1 org_units
 * never get purged by Tailwind CSS v4 at build time and preserve >= 4.5:1 contrast.
 */
export const ACCENT_TOKENS = [
  'orange',
  'red',
  'green',
  'slate',
  'blue',
  'sky',
  'amber',
  'violet',
  'teal',
  'emerald',
  'indigo',
  'rose',
] as const;

export type AccentToken = (typeof ACCENT_TOKENS)[number];

export interface AccentPaletteEntry {
  token: AccentToken;
  label: string;
  hex: string;
  cellSurface: string;
  cellBorder: string;
  badgeClass: string;
  dotClass: string;
  ringClass: string;
}

export const ACCENT_PALETTE: Record<AccentToken, AccentPaletteEntry> = {
  orange: {
    token: 'orange',
    label: 'Orange',
    hex: '#c2410c',
    cellSurface: 'bg-orange-50/90',
    cellBorder: 'border-orange-300',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    dotClass: 'bg-orange-700',
    ringClass: 'ring-orange-600',
  },
  red: {
    token: 'red',
    label: 'Red',
    hex: '#b91c1c',
    cellSurface: 'bg-red-50/90',
    cellBorder: 'border-red-300',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    dotClass: 'bg-red-700',
    ringClass: 'ring-red-600',
  },
  green: {
    token: 'green',
    label: 'Green',
    hex: '#15803d',
    cellSurface: 'bg-green-50/90',
    cellBorder: 'border-green-300',
    badgeClass: 'bg-green-100 text-green-900 border-green-300',
    dotClass: 'bg-green-700',
    ringClass: 'ring-green-600',
  },
  slate: {
    token: 'slate',
    label: 'Slate',
    hex: '#334155',
    cellSurface: 'bg-slate-100',
    cellBorder: 'border-slate-300',
    badgeClass: 'bg-slate-200 text-slate-900 border-slate-400',
    dotClass: 'bg-slate-700',
    ringClass: 'ring-slate-600',
  },
  blue: {
    token: 'blue',
    label: 'Blue',
    hex: '#1d4ed8',
    cellSurface: 'bg-blue-50/90',
    cellBorder: 'border-blue-300',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    dotClass: 'bg-blue-700',
    ringClass: 'ring-blue-600',
  },
  sky: {
    token: 'sky',
    label: 'Sky',
    hex: '#0369a1',
    cellSurface: 'bg-sky-50/90',
    cellBorder: 'border-sky-300',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    dotClass: 'bg-sky-700',
    ringClass: 'ring-sky-600',
  },
  amber: {
    token: 'amber',
    label: 'Amber',
    hex: '#92400e',
    cellSurface: 'bg-amber-50/90',
    cellBorder: 'border-amber-300',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-800',
    ringClass: 'ring-amber-700',
  },
  violet: {
    token: 'violet',
    label: 'Violet',
    hex: '#6d28d9',
    cellSurface: 'bg-violet-50/90',
    cellBorder: 'border-violet-300',
    badgeClass: 'bg-violet-100 text-violet-900 border-violet-300',
    dotClass: 'bg-violet-700',
    ringClass: 'ring-violet-600',
  },
  teal: {
    token: 'teal',
    label: 'Teal',
    hex: '#0f766e',
    cellSurface: 'bg-teal-50/90',
    cellBorder: 'border-teal-300',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    dotClass: 'bg-teal-700',
    ringClass: 'ring-teal-600',
  },
  emerald: {
    token: 'emerald',
    label: 'Emerald',
    hex: '#047857',
    cellSurface: 'bg-emerald-50/90',
    cellBorder: 'border-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-700',
    ringClass: 'ring-emerald-600',
  },
  indigo: {
    token: 'indigo',
    label: 'Indigo',
    hex: '#4338ca',
    cellSurface: 'bg-indigo-50/90',
    cellBorder: 'border-indigo-300',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    dotClass: 'bg-indigo-700',
    ringClass: 'ring-indigo-600',
  },
  rose: {
    token: 'rose',
    label: 'Rose',
    hex: '#be123c',
    cellSurface: 'bg-rose-50/90',
    cellBorder: 'border-rose-300',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    dotClass: 'bg-rose-700',
    ringClass: 'ring-rose-600',
  },
};

export function resolveAccentPalette(token: string | undefined | null): AccentPaletteEntry {
  if (token && token in ACCENT_PALETTE) {
    return ACCENT_PALETTE[token as AccentToken];
  }
  return ACCENT_PALETTE.slate;
}
