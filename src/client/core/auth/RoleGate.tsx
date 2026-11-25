import type { ReactNode } from 'react';
import { hasMinimumRole, type UserRole } from '@shared/constants';
import { useSession } from './useSession';

interface RoleGateProps {
  minimumRole: UserRole;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ minimumRole, fallback = null, children }: RoleGateProps) {
  const { user } = useSession();
  const effectiveRole: UserRole = user?.role ?? 'officer';

  if (!hasMinimumRole(effectiveRole, minimumRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
