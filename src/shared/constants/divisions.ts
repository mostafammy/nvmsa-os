export const SUPPORT_DIVISIONS = [
  {
    code: 'PNSDD',
    name: 'Publications and New Technologies Support Division',
    color: '#0f766e',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    code: 'PSDD',
    name: 'Projects Support Division',
    color: '#7c3aed',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  {
    code: 'CBDD',
    name: 'Capacity Building Support Division',
    color: '#ca8a04',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    code: 'FSDD',
    name: 'Fundraising Support Division',
    color: '#059669',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    code: 'EB',
    name: 'Executive Board (General)',
    color: '#4f46e5',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
] as const;

export type SupportDivisionCode = (typeof SUPPORT_DIVISIONS)[number]['code'];

export const SUPPORT_DIVISION_CODES = SUPPORT_DIVISIONS.map(
  (division) => division.code,
) as [SupportDivisionCode, ...SupportDivisionCode[]];
