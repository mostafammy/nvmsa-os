import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@shared/types';
import {
  apiClient,
  getStoredDevPersona,
  setStoredDevPersona,
  type DevPersona,
} from '../api/client';

interface SessionContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  switchDevPersona: (persona: DevPersona | null) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.api.me.$get();
      if (res.ok) {
        const payload = (await res.json()) as { user: SessionUser | null };
        setUser(payload.user);
      } else {
        setUser(null);
      }
    } catch {
      const devPersona = getStoredDevPersona();
      if (devPersona) {
        setUser({
          id: devPersona.userId,
          name: devPersona.userName,
          email: `${devPersona.role}@nvmsa.local`,
          role: devPersona.role,
          entityCode: devPersona.entityCode as SessionUser['entityCode'],
        });
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const switchDevPersona = useCallback(
    async (persona: DevPersona | null) => {
      setStoredDevPersona(persona);
      await refreshSession();
      await queryClient.invalidateQueries();
    },
    [queryClient, refreshSession],
  );

  return (
    <SessionContext.Provider value={{ user, isLoading, refreshSession, switchDevPersona }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside AuthProvider');
  }
  return ctx;
}
