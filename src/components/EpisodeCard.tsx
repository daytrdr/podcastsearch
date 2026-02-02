import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FavoriteButton } from './FavoriteButton';
import type { Episode } from '../types';

export function EpisodeCard(episode: Episode) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2">{episode.title}</CardTitle>
            <CardDescription className="line-clamp-1">
              {episode.podcastTitle} · {episode.podcastAuthor}
            </CardDescription>
          </div>
          <FavoriteButton id={episode.id} type="episode" size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {episode.description}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {episode.duration}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(episode.releaseDate)}
          </Badge>
          {episode.episodeNumber && (
            <Badge variant="secondary">
              Episode {episode.episodeNumber}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
