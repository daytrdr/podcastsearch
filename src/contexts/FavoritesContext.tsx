import { createContext, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { FavoriteType } from '../types';

interface FavoritesContextType {
  favorites: {
    podcasts: Set<string>;
    episodes: Set<string>;
    authors: Set<string>;
  };
  toggleFavorite: (id: string, type: FavoriteType) => void;
  isFavorite: (id: string, type: FavoriteType) => boolean;
  getFavoriteCount: (type: FavoriteType) => number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<{
    podcasts: Set<string>;
    episodes: Set<string>;
    authors: Set<string>;
  }>({
    podcasts: new Set(),
    episodes: new Set(),
    authors: new Set(),
  });

  const toggleFavorite = useCallback((id: string, type: FavoriteType) => {
    setFavorites((prev) => {
      const key = `${type}s` as keyof typeof prev;
      const newSet = new Set(prev[key]);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      return {
        ...prev,
        [key]: newSet,
      };
    });
  }, []);

  const isFavorite = useCallback((id: string, type: FavoriteType) => {
    const key = `${type}s` as keyof typeof favorites;
    return favorites[key].has(id);
  }, [favorites]);

  const getFavoriteCount = useCallback((type: FavoriteType) => {
    const key = `${type}s` as keyof typeof favorites;
    return favorites[key].size;
  }, [favorites]);

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      getFavoriteCount,
    }),
    [favorites, toggleFavorite, isFavorite, getFavoriteCount]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export { FavoritesContext, FavoritesProvider };
