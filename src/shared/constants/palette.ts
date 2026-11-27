/**
 * Closed 12-token WCAG AA accent palette tuned for NVMSA Dark OS glass surfaces.
 * Static Tailwind classes guarantee dynamic D1 org_units never get purged at build time
 * and preserve >= 4.5:1 contrast on dark obsidian cards.
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
    hex: '#fb923c',
    cellSurface: 'bg-orange-500/[0.13]',
    cellBorder: 'border-orange-400/35',
    badgeClass: 'bg-orange-500/20 text-orange-200 border-orange-400/35',
    dotClass: 'bg-orange-400',
    ringClass: 'ring-orange-400',
  },
  red: {
    token: 'red',
    label: 'Red',
    hex: '#f87171',
    cellSurface: 'bg-red-500/[0.13]',
    cellBorder: 'border-red-400/35',
    badgeClass: 'bg-red-500/20 text-red-200 border-red-400/35',
    dotClass: 'bg-red-400',
    ringClass: 'ring-red-400',
  },
  green: {
    token: 'green',
    label: 'Green',
    hex: '#4ade80',
    cellSurface: 'bg-green-500/[0.13]',
    cellBorder: 'border-green-400/35',
    badgeClass: 'bg-green-500/20 text-green-200 border-green-400/35',
    dotClass: 'bg-green-400',
    ringClass: 'ring-green-400',
  },
  slate: {
    token: 'slate',
    label: 'Slate',
    hex: '#94a3b8',
    cellSurface: 'bg-slate-400/[0.13]',
    cellBorder: 'border-slate-400/35',
    badgeClass: 'bg-slate-400/20 text-slate-200 border-slate-400/35',
    dotClass: 'bg-slate-300',
    ringClass: 'ring-slate-300',
  },
  blue: {
    token: 'blue',
    label: 'Blue',
    hex: '#60a5fa',
    cellSurface: 'bg-blue-500/[0.14]',
    cellBorder: 'border-blue-400/35',
    badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-400/35',
    dotClass: 'bg-blue-400',
    ringClass: 'ring-blue-400',
  },
  sky: {
    token: 'sky',
    label: 'Sky',
    hex: '#38bdf8',
    cellSurface: 'bg-sky-500/[0.14]',
    cellBorder: 'border-sky-400/35',
    badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/35',
    dotClass: 'bg-sky-400',
    ringClass: 'ring-sky-400',
  },
  amber: {
    token: 'amber',
    label: 'Amber',
    hex: '#fbbf24',
    cellSurface: 'bg-amber-500/[0.13]',
    cellBorder: 'border-amber-400/35',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/35',
    dotClass: 'bg-amber-400',
    ringClass: 'ring-amber-400',
  },
  violet: {
    token: 'violet',
    label: 'Violet',
    hex: '#a78bfa',
    cellSurface: 'bg-violet-500/[0.13]',
    cellBorder: 'border-violet-400/35',
    badgeClass: 'bg-violet-500/20 text-violet-200 border-violet-400/35',
    dotClass: 'bg-violet-400',
    ringClass: 'ring-violet-400',
  },
  teal: {
    token: 'teal',
    label: 'Teal',
    hex: '#2dd4bf',
    cellSurface: 'bg-teal-500/[0.14]',
    cellBorder: 'border-teal-400/35',
    badgeClass: 'bg-teal-500/20 text-teal-200 border-teal-400/35',
    dotClass: 'bg-teal-400',
    ringClass: 'ring-teal-400',
  },
  emerald: {
    token: 'emerald',
    label: 'Emerald',
    hex: '#34d399',
    cellSurface: 'bg-emerald-500/[0.13]',
    cellBorder: 'border-emerald-400/35',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35',
    dotClass: 'bg-emerald-400',
    ringClass: 'ring-emerald-400',
  },
  indigo: {
    token: 'indigo',
    label: 'Indigo',
    hex: '#818cf8',
    cellSurface: 'bg-indigo-500/[0.14]',
    cellBorder: 'border-indigo-400/35',
    badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/35',
    dotClass: 'bg-indigo-400',
    ringClass: 'ring-indigo-400',
  },
  rose: {
    token: 'rose',
    label: 'Rose',
    hex: '#fb7185',
    cellSurface: 'bg-rose-500/[0.13]',
    cellBorder: 'border-rose-400/35',
    badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/35',
    dotClass: 'bg-rose-400',
    ringClass: 'ring-rose-400',
  },
};

export function resolveAccentPalette(token: string | undefined | null): AccentPaletteEntry {
  if (token && token in ACCENT_PALETTE) {
    return ACCENT_PALETTE[token as AccentToken];
  }
  return ACCENT_PALETTE.slate;
}
