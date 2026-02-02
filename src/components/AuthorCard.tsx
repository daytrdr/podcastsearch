import { Mic, Radio } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FavoriteButton } from './FavoriteButton';
import type { Author } from '../types';

export function AuthorCard(author: Author) {
  const visibleGenres = author.genres.slice(0, 3);
  const remainingCount = author.genres.length - 3;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <img
              src={author.imageUrl}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-1">{author.name}</CardTitle>
              <FavoriteButton id={author.id} type="author" size="sm" />
            </div>
            <CardDescription className="line-clamp-2 mt-1">
              {author.bio}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Radio className="h-4 w-4" />
            <span>{author.podcastCount} podcast{author.podcastCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mic className="h-4 w-4" />
            <span>{author.totalEpisodes} episodes</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visibleGenres.map((genre) => (
            <Badge key={genre} variant="secondary">
              {genre}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="outline">
              +{remainingCount} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
