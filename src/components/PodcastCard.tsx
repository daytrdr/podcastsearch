import { Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FavoriteButton } from './FavoriteButton';
import type { Podcast } from '../types';

export function PodcastCard(podcast: Podcast) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={podcast.imageUrl}
          alt={podcast.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1">{podcast.title}</CardTitle>
            <CardDescription className="line-clamp-1">{podcast.author}</CardDescription>
          </div>
          <FavoriteButton id={podcast.id} type="podcast" size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {podcast.description}
        </p>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{podcast.category}</Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{podcast.episodeCount} episodes</span>
            <div className="flex items-center gap-1">
              {renderStars(podcast.rating)}
              <span className="ml-1">{podcast.rating}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Latest: {formatDate(podcast.latestEpisodeDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
