import { ACCENT_PALETTE, type AccentToken } from './palette';

export interface CanonicalUnitMetadata {
  code: string;
  name: string;
  kind: 'COMMITTEE' | 'DIVISION' | 'BOARD';
  accentToken: AccentToken;
  badgeClass: string;
}

export const STANDING_COMMITTEES: readonly CanonicalUnitMetadata[] = [
  {
    code: 'SCOPH',
    name: 'Standing Committee on Public Health',
    kind: 'COMMITTEE',
    accentToken: 'orange',
    badgeClass: ACCENT_PALETTE.orange.badgeClass,
  },
  {
    code: 'SCORP',
    name: 'Standing Committee on Human Rights and Peace',
    kind: 'COMMITTEE',
    accentToken: 'red',
    badgeClass: ACCENT_PALETTE.red.badgeClass,
  },
  {
    code: 'SCOME',
    name: 'Standing Committee on Medical Education',
    kind: 'COMMITTEE',
    accentToken: 'green',
    badgeClass: ACCENT_PALETTE.green.badgeClass,
  },
  {
    code: 'SCORA',
    name: 'Standing Committee on Sexual & Reproductive Health and Rights',
    kind: 'COMMITTEE',
    accentToken: 'rose',
    badgeClass: ACCENT_PALETTE.rose.badgeClass,
  },
  {
    code: 'SCOPE',
    name: 'Standing Committee on Professional Exchange',
    kind: 'COMMITTEE',
    accentToken: 'blue',
    badgeClass: ACCENT_PALETTE.blue.badgeClass,
  },
  {
    code: 'SCORE',
    name: 'Standing Committee on Research Exchange',
    kind: 'COMMITTEE',
    accentToken: 'sky',
    badgeClass: ACCENT_PALETTE.sky.badgeClass,
  },
];
