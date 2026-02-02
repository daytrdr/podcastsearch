export interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  category: string;
  episodeCount: number;
  rating: number;
  latestEpisodeDate: string; // ISO date
}

export interface Episode {
  id: string;
  title: string;
  podcastTitle: string;
  podcastAuthor: string;
  description: string;
  duration: string; // "45:30"
  releaseDate: string; // ISO date
  episodeNumber?: number;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
  podcastCount: number;
  totalEpisodes: number;
  genres: string[];
}

export type FavoriteType = 'podcast' | 'episode' | 'author';
