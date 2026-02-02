import { useContext } from 'react';
import { SearchCacheContext } from '../contexts/SearchCacheContext';

export function useSearchCache() {
  const context = useContext(SearchCacheContext);

  if (context === undefined) {
    throw new Error('useSearchCache must be used within a SearchCacheProvider');
  }

  return context;
}
