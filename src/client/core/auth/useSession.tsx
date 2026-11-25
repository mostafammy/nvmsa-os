import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SessionUser, SignInInput } from '@shared/types';
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
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
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

  const signIn = useCallback(
    async (input: SignInInput) => {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        let message = 'Invalid email or password';
        try {
          const body = (await res.json()) as { message?: string; error?: { message?: string } };
          message = body.message ?? body.error?.message ?? message;
        } catch {
          // Keep default error message
        }
        throw new Error(message);
      }

      setStoredDevPersona(null);
      await refreshSession();
      await queryClient.invalidateQueries();
    },
    [queryClient, refreshSession],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setStoredDevPersona(null);
      setUser(null);
      await queryClient.invalidateQueries();
    }
  }, [queryClient]);

  const switchDevPersona = useCallback(
    async (persona: DevPersona | null) => {
      setStoredDevPersona(persona);
      await refreshSession();
      await queryClient.invalidateQueries();
    },
    [queryClient, refreshSession],
  );

  return (
    <SessionContext.Provider
      value={{ user, isLoading, refreshSession, signIn, signOut, switchDevPersona }}
    >
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
