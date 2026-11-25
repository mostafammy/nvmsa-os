export const USER_ROLES = ['officer', 'eb', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  officer: 'Officer (Public)',
  eb: 'EB Member',
  admin: 'Admin',
};

export const ROLE_RANK: Record<UserRole, number> = {
  officer: 0,
  eb: 1,
  admin: 2,
};

export function hasMinimumRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
