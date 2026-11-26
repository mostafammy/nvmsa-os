import type { CanonicalUnitMetadata } from './committees';
import { ACCENT_PALETTE } from './palette';

export const SUPPORT_DIVISIONS: readonly CanonicalUnitMetadata[] = [
  {
    code: 'CBSDD',
    name: 'Capacity Building Support Division',
    kind: 'DIVISION',
    accentToken: 'amber',
    badgeClass: ACCENT_PALETTE.amber.badgeClass,
  },
  {
    code: 'PSDD',
    name: 'Project Support Division',
    kind: 'DIVISION',
    accentToken: 'violet',
    badgeClass: ACCENT_PALETTE.violet.badgeClass,
  },
  {
    code: 'PNSDD',
    name: 'Publication & New Technology Support Division',
    kind: 'DIVISION',
    accentToken: 'teal',
    badgeClass: ACCENT_PALETTE.teal.badgeClass,
  },
  {
    code: 'RSDD',
    name: 'Research Support Division',
    kind: 'DIVISION',
    accentToken: 'emerald',
    badgeClass: ACCENT_PALETTE.emerald.badgeClass,
  },
  {
    code: 'EB',
    name: 'Executive Board',
    kind: 'BOARD',
    accentToken: 'indigo',
    badgeClass: ACCENT_PALETTE.indigo.badgeClass,
  },
];
