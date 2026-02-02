import { createContext, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  LRUCache,
  saveToStorage,
  loadFromStorage,
  getStorageTimestamp,
  clearExpiredStorage,
  clearAllStorage,
} from '../lib/cache';

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheMetadata {
  fromCache: boolean;
  age?: number; // milliseconds since cached
  source?: 'memory' | 'storage';
}

interface SearchCacheContextType {
  getCached: <T>(key: string) => { data: T; metadata: CacheMetadata } | undefined;
  setCached: <T>(key: string, value: T) => void;
  clearCache: () => void;
  getCacheAge: (key: string) => number | undefined;
}

const SearchCacheContext = createContext<SearchCacheContextType | undefined>(undefined);

interface SearchCacheProviderProps {
  children: ReactNode;
  ttl?: number;
}

function SearchCacheProvider({ children, ttl = DEFAULT_TTL }: SearchCacheProviderProps) {
  // Use ref to persist cache across renders without causing re-renders
  const cacheRef = useRef<LRUCache<unknown>>(new LRUCache({ ttl }));

  // Clean up expired localStorage entries on mount
  useEffect(() => {
    clearExpiredStorage(ttl);
  }, [ttl]);

  const getCached = useCallback(<T,>(key: string): { data: T; metadata: CacheMetadata } | undefined => {
    // First, check memory cache
    const memoryValue = cacheRef.current.get(key);
    if (memoryValue !== undefined) {
      return {
        data: memoryValue as T,
        metadata: {
          fromCache: true,
          age: cacheRef.current.getAge(key),
          source: 'memory',
        },
      };
    }

    // Fall back to localStorage
    const storageValue = loadFromStorage<T>(key, ttl);
    if (storageValue !== undefined) {
      // Populate memory cache for faster subsequent access
      cacheRef.current.set(key, storageValue);
      const timestamp = getStorageTimestamp(key);
      return {
        data: storageValue,
        metadata: {
          fromCache: true,
          age: timestamp ? Date.now() - timestamp : undefined,
          source: 'storage',
        },
      };
    }

    return undefined;
  }, [ttl]);

  const setCached = useCallback(<T,>(key: string, value: T): void => {
    // Save to both memory and localStorage
    cacheRef.current.set(key, value);
    saveToStorage(key, value);
  }, []);

  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
    clearAllStorage();
  }, []);

  const getCacheAge = useCallback((key: string): number | undefined => {
    // Check memory first
    const memoryAge = cacheRef.current.getAge(key);
    if (memoryAge !== undefined) {
      return memoryAge;
    }

    // Fall back to localStorage timestamp
    const timestamp = getStorageTimestamp(key);
    if (timestamp !== undefined) {
      return Date.now() - timestamp;
    }

    return undefined;
  }, []);

  const value = useMemo(
    () => ({
      getCached,
      setCached,
      clearCache,
      getCacheAge,
    }),
    [getCached, setCached, clearCache, getCacheAge]
  );

  return (
    <SearchCacheContext.Provider value={value}>
      {children}
    </SearchCacheContext.Provider>
  );
}

export { SearchCacheContext, SearchCacheProvider };
export type { SearchCacheContextType, CacheMetadata };
