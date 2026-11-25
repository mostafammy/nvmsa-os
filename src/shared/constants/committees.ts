export const STANDING_COMMITTEES = [
  {
    code: 'SCOPH',
    name: 'Standing Committee on Public Health',
    color: '#ea580c',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    code: 'SCORA',
    name: 'Standing Committee on Sexual & Reproductive Health and Rights',
    color: '#dc2626',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    code: 'SCORP',
    name: 'Standing Committee on Human Rights and Peace',
    color: '#16a34a',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
  },
  {
    code: 'SCOME',
    name: 'Standing Committee on Medical Education',
    color: '#0f172a',
    badgeClass: 'bg-slate-200 text-slate-900 border-slate-300',
  },
  {
    code: 'SCOPE',
    name: 'Standing Committee on Professional Exchange',
    color: '#2563eb',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    code: 'SCORE',
    name: 'Standing Committee on Research Exchange',
    color: '#0284c7',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
] as const;

export type StandingCommitteeCode = (typeof STANDING_COMMITTEES)[number]['code'];

export const STANDING_COMMITTEE_CODES = STANDING_COMMITTEES.map(
  (committee) => committee.code,
) as [StandingCommitteeCode, ...StandingCommitteeCode[]];
