import type { ReactNode } from 'react';
import type { SeatCapabilities } from '@shared/constants';
import { useSession } from './useSession';

interface RoleGateProps {
  requireAuthenticated?: boolean;
  capability?: keyof SeatCapabilities;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({
  requireAuthenticated = true,
  capability,
  fallback = null,
  children,
}: RoleGateProps) {
  const { user } = useSession();

  if (requireAuthenticated && !user) {
    return <>{fallback}</>;
  }

  if (capability && (!user || !user.capabilities[capability])) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
