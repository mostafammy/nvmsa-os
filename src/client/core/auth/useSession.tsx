import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SeatSessionUser } from '@shared/types';
import { apiClient, parseApiError } from '../api/client';
import { clearAllSwrCache } from '../storage/cache';

export type AuthOutcome = 'public' | 'authenticated' | 'seat_revoked' | 'auth_error';

interface SessionContextValue {
  user: SeatSessionUser | null;
  authOutcome: AuthOutcome;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SeatSessionUser | null>(null);
  const [authOutcome, setAuthOutcome] = useState<AuthOutcome>('public');
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.api.v1.me.$get();
      if (res.ok) {
        const payload = (await res.json()) as {
          user: SeatSessionUser | null;
          authOutcome?: AuthOutcome;
        };
        setUser(payload.user);
        setAuthOutcome(payload.authOutcome ?? (payload.user ? 'authenticated' : 'public'));
      } else {
        setUser(null);
        setAuthOutcome('public');
      }
    } catch {
      setUser(null);
      setAuthOutcome('public');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signInWithGoogle = useCallback(async () => {
    const res = await fetch('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider: 'google',
        callbackURL: window.location.href,
      }),
    });

    if (!res.ok) {
      throw await parseApiError(res, 'Could not start Google sign-in');
    }

    const payload = (await res.json()) as { url?: string };
    if (payload.url) {
      window.location.assign(payload.url);
    } else {
      throw new Error('Google sign-in redirect URL was not returned by server');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearAllSwrCache();
      queryClient.clear();
      setUser(null);
      setAuthOutcome('public');
    }
  }, [queryClient]);

  return (
    <SessionContext.Provider
      value={{
        user,
        authOutcome,
        isLoading,
        refreshSession,
        signInWithGoogle,
        signOut,
      }}
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
