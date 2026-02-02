/**
 * LRU Cache with TTL support for iTunes API responses
 */

interface CacheEntry<V> {
  value: V;
  timestamp: number;
}

interface StoredCacheEntry {
  data: unknown;
  timestamp: number;
  version: 1;
}

const CACHE_VERSION = 1;
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
const DEFAULT_MAX_SIZE = 100;
const STORAGE_KEY_PREFIX = 'itunes-cache:';

export class LRUCache<V> {
  private cache = new Map<string, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.ttl = options.ttl ?? DEFAULT_TTL;
  }

  get(key: string): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (this.isExpired(entry.timestamp)) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: V): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry.timestamp)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  getAge(key: string): number | undefined {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry.timestamp)) {
      return undefined;
    }
    return Date.now() - entry.timestamp;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.ttl;
  }
}

/**
 * Generate a deterministic cache key from search parameters
 */
export function generateCacheKey(
  type: 'podcast' | 'episode' | 'author' | 'all',
  term: string,
  options?: { media?: string; limit?: number; country?: string }
): string {
  const normalized = {
    type,
    term: term.toLowerCase().trim(),
    media: options?.media ?? 'podcast',
    limit: options?.limit ?? 50,
    country: options?.country ?? 'US',
  };
  return `itunes:${normalized.type}:${normalized.term}:${normalized.media}:${normalized.limit}:${normalized.country}`;
}

/**
 * localStorage persistence helpers
 */
export function saveToStorage<V>(key: string, value: V): void {
  try {
    const entry: StoredCacheEntry = {
      data: value,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    // localStorage might be full or unavailable
    console.warn('Failed to save to localStorage:', error);
  }
}

export function loadFromStorage<V>(key: string, ttl: number = DEFAULT_TTL): V | undefined {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (!stored) return undefined;

    const entry: StoredCacheEntry = JSON.parse(stored);

    // Check version compatibility
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > ttl) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
      return undefined;
    }

    return entry.data as V;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return undefined;
  }
}

export function getStorageTimestamp(key: string): number | undefined {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (!stored) return undefined;

    const entry: StoredCacheEntry = JSON.parse(stored);
    return entry.timestamp;
  } catch {
    return undefined;
  }
}

export function clearExpiredStorage(ttl: number = DEFAULT_TTL): void {
  try {
    const keysToRemove: string[] = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const entry: StoredCacheEntry = JSON.parse(stored);
        if (entry.version !== CACHE_VERSION || now - entry.timestamp > ttl) {
          keysToRemove.push(key);
        }
      } catch {
        // Invalid JSON, remove it
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.debug(`Cleared ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.warn('Failed to clear expired storage:', error);
  }
}

export function clearAllStorage(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear storage:', error);
  }
}
