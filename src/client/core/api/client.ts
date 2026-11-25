import { hc } from 'hono/client';
import type { AppType } from '@server/index';

const DEV_PERSONA_STORAGE_KEY = 'nvmsa_os_dev_persona';

export interface DevPersona {
  role: 'officer' | 'eb' | 'admin';
  userId: string;
  userName: string;
  entityCode: string;
}

export function getStoredDevPersona(): DevPersona | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(DEV_PERSONA_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DevPersona) : null;
  } catch {
    return null;
  }
}

export function setStoredDevPersona(persona: DevPersona | null): void {
  if (!import.meta.env.DEV) return;
  if (!persona) {
    localStorage.removeItem(DEV_PERSONA_STORAGE_KEY);
    return;
  }
  localStorage.setItem(DEV_PERSONA_STORAGE_KEY, JSON.stringify(persona));
}

export const apiClient = hc<AppType>('/', {
  headers: (): Record<string, string> => {
    const devPersona = getStoredDevPersona();
    if (!devPersona) return {};
    return {
      'x-dev-role': devPersona.role,
      'x-dev-user-id': devPersona.userId,
      'x-dev-user-name': devPersona.userName,
      'x-dev-entity': devPersona.entityCode,
    };
  },
});
