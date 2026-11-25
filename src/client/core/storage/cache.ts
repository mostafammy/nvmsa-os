const CACHE_PREFIX = 'nvmsa_os_swr:';

interface CacheEnvelope<T> {
  updatedAt: number;
  data: T;
}

export function readSwrCache<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 12): T | undefined {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return undefined;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - envelope.updatedAt > maxAgeMs) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return undefined;
    }
    return envelope.data;
  } catch {
    return undefined;
  }
}

export function writeSwrCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      updatedAt: Date.now(),
      data,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(envelope));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}
