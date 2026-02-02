import { useMemo } from 'react';

interface UseSearchOptions<T> {
  items: T[];
  searchQuery: string;
  searchFields: (keyof T)[];
}

export function useSearch<T>({ items, searchQuery, searchFields }: UseSearchOptions<T>): T[] {
  return useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    
    if (!lowerQuery) {
      return items;
    }

    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }, [items, searchQuery, searchFields]);
}
