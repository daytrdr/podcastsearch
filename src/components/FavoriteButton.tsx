import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useFavorites } from '../hooks/useFavorites';
import type { FavoriteType } from '../types';
import { cn } from '../lib/utils';

interface FavoriteButtonProps {
  id: string;
  type: FavoriteType;
  size?: 'sm' | 'default' | 'lg';
}

export function FavoriteButton({ id, type, size = 'default' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(id, type);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id, type);
  };

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      onClick={handleClick}
      className={cn(
        'transition-all duration-200',
        favorited && 'text-red-500 hover:text-red-600'
      )}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all duration-200',
          favorited && 'fill-current scale-110'
        )}
      />
    </Button>
  );
}
