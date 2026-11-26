const LEGACY_CACHE_PREFIX = 'nvmsa_os_swr:';
const CACHE_V2_PREFIX = 'nvmsa_os_swr:v2:';

export interface SwrCacheEnvelope<T> {
  updatedAt: number;
  data: T;
}

function buildKey(scope: string, key: string): string {
  return `${CACHE_V2_PREFIX}${scope}:${key}`;
}

export function readSwrCacheWithMeta<T>(
  scope: string,
  key: string,
  maxAgeMs = 1000 * 60 * 60 * 12,
): SwrCacheEnvelope<T> | undefined {
  try {
    const fullKey = buildKey(scope, key);
    const raw = localStorage.getItem(fullKey);
    if (!raw) return undefined;
    const envelope = JSON.parse(raw) as SwrCacheEnvelope<T>;
    if (Date.now() - envelope.updatedAt > maxAgeMs) {
      localStorage.removeItem(fullKey);
      return undefined;
    }
    return envelope;
  } catch {
    return undefined;
  }
}

export function writeSwrCache<T>(scope: string, key: string, data: T): void {
  try {
    const envelope: SwrCacheEnvelope<T> = {
      updatedAt: Date.now(),
      data,
    };
    localStorage.setItem(buildKey(scope, key), JSON.stringify(envelope));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

/**
 * Synchronously purges all v1 and v2 SWR cache entries across shared devices.
 */
export function clearAllSwrCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEGACY_CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch {
    // Ignore storage access errors
  }
}
