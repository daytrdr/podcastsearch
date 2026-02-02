import type { Podcast, Episode, Author } from '../types';
import { LRUCache, generateCacheKey, saveToStorage, loadFromStorage } from './cache';
import { deduplicatedFetch } from './requestDedup';

const ITUNES_API_BASE = 'https://itunes.apple.com';
const RATE_LIMIT_DELAY = 3000; // 3 seconds between requests to stay under 20/min
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Raw result type that preserves all fields from the API
export interface ITunesRawResult {
  [key: string]: unknown;
}

export interface ITunesGenericSearchResponse {
  resultCount: number;
  results: ITunesRawResult[];
}

// Module-level caches for different search types
const podcastCache = new LRUCache<Podcast[]>({ ttl: CACHE_TTL });
const episodeCache = new LRUCache<Episode[]>({ ttl: CACHE_TTL });
const authorCache = new LRUCache<Author[]>({ ttl: CACHE_TTL });
const allCache = new LRUCache<ITunesGenericSearchResponse>({ ttl: CACHE_TTL });

// Cache metadata for consumers
export interface CacheInfo {
  fromCache: boolean;
  cacheAge?: number;
}

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesResult[];
}

interface ITunesResult {
  wrapperType: string;
  kind?: string;
  collectionId?: number;
  trackId?: number;
  artistId?: number;
  collectionName?: string;
  trackName?: string;
  artistName?: string;
  collectionCensoredName?: string;
  trackCensoredName?: string;
  collectionViewUrl?: string;
  trackViewUrl?: string;
  artworkUrl600?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  releaseDate?: string;
  collectionExplicitness?: string;
  trackExplicitness?: string;
  trackCount?: number;
  primaryGenreName?: string;
  contentAdvisoryRating?: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  trackTimeMillis?: number;
  country?: string;
  genres?: string[];
  genreIds?: string[];
}

let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
}

function mapITunesResultToPodcast(result: ITunesResult): Podcast {
  const id = String(result.collectionId || result.trackId || Math.random());
  
  return {
    id,
    title: result.collectionName || result.trackName || 'Unknown Podcast',
    author: result.artistName || 'Unknown Artist',
    description: result.longDescription || result.description || result.shortDescription || 'No description available',
    imageUrl: result.artworkUrl600 || result.artworkUrl100 || result.artworkUrl60 || 'https://via.placeholder.com/300/4A90E2/ffffff?text=Podcast',
    category: result.primaryGenreName || 'Uncategorized',
    episodeCount: result.trackCount || 0,
    rating: 4.5, // iTunes API doesn't provide ratings
    latestEpisodeDate: result.releaseDate || new Date().toISOString(),
  };
}

function mapITunesResultToEpisode(result: ITunesResult): Episode {
  const id = String(result.trackId || result.collectionId || Math.random());
  const durationMs = result.trackTimeMillis || 0;
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  const duration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
  
  return {
    id,
    title: result.trackName || result.collectionName || 'Unknown Episode',
    podcastTitle: result.collectionName || 'Unknown Podcast',
    podcastAuthor: result.artistName || 'Unknown Artist',
    description: result.longDescription || result.description || result.shortDescription || 'No description available',
    duration,
    releaseDate: result.releaseDate || new Date().toISOString(),
    episodeNumber: undefined,
  };
}

function mapITunesResultToAuthor(result: ITunesResult, podcastCount: number = 1): Author {
  const id = String(result.artistId || result.collectionId || Math.random());
  
  return {
    id,
    name: result.artistName || 'Unknown Artist',
    bio: result.longDescription || result.description || `Creator of ${result.collectionName || 'podcasts'}`,
    imageUrl: result.artworkUrl600 || result.artworkUrl100 || result.artworkUrl60 || 'https://via.placeholder.com/150/4A90E2/ffffff?text=Author',
    podcastCount,
    totalEpisodes: result.trackCount || 0,
    genres: result.genres || (result.primaryGenreName ? [result.primaryGenreName] : ['Podcast']),
  };
}

export async function searchPodcasts(term: string, limit: number = 50): Promise<Podcast[]> {
  if (!term.trim()) return [];

  const cacheKey = generateCacheKey('podcast', term, { limit });

  // Check memory cache first
  const cachedMemory = podcastCache.get(cacheKey);
  if (cachedMemory !== undefined) {
    return cachedMemory;
  }

  // Check localStorage cache
  const cachedStorage = loadFromStorage<Podcast[]>(cacheKey, CACHE_TTL);
  if (cachedStorage !== undefined) {
    podcastCache.set(cacheKey, cachedStorage);
    return cachedStorage;
  }

  // Use deduplication to prevent duplicate in-flight requests
  return deduplicatedFetch(cacheKey, async () => {
    await rateLimit();

    try {
      const url = new URL(`${ITUNES_API_BASE}/search`);
      url.searchParams.append('term', term);
      url.searchParams.append('media', 'podcast');
      url.searchParams.append('entity', 'podcast');
      url.searchParams.append('limit', String(limit));
      url.searchParams.append('country', 'US');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data: ITunesSearchResponse = await response.json();

      const results = data.results
        .filter(result => result.wrapperType === 'track' || result.kind === 'podcast')
        .map(mapITunesResultToPodcast);

      // Cache the results
      podcastCache.set(cacheKey, results);
      saveToStorage(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Error searching podcasts:', error);
      throw error;
    }
  });
}

export async function searchEpisodes(term: string, limit: number = 50): Promise<Episode[]> {
  if (!term.trim()) return [];

  const cacheKey = generateCacheKey('episode', term, { limit });

  // Check memory cache first
  const cachedMemory = episodeCache.get(cacheKey);
  if (cachedMemory !== undefined) {
    return cachedMemory;
  }

  // Check localStorage cache
  const cachedStorage = loadFromStorage<Episode[]>(cacheKey, CACHE_TTL);
  if (cachedStorage !== undefined) {
    episodeCache.set(cacheKey, cachedStorage);
    return cachedStorage;
  }

  // Use deduplication to prevent duplicate in-flight requests
  return deduplicatedFetch(cacheKey, async () => {
    await rateLimit();

    try {
      const url = new URL(`${ITUNES_API_BASE}/search`);
      url.searchParams.append('term', term);
      url.searchParams.append('media', 'podcast');
      url.searchParams.append('entity', 'podcastEpisode');
      url.searchParams.append('limit', String(limit));
      url.searchParams.append('country', 'US');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data: ITunesSearchResponse = await response.json();

      const results = data.results
        .filter(result => result.kind === 'podcast-episode')
        .map(mapITunesResultToEpisode);

      // Cache the results
      episodeCache.set(cacheKey, results);
      saveToStorage(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Error searching episodes:', error);
      throw error;
    }
  });
}

export async function searchAuthors(term: string, limit: number = 50): Promise<Author[]> {
  if (!term.trim()) return [];

  const cacheKey = generateCacheKey('author', term, { limit });

  // Check memory cache first
  const cachedMemory = authorCache.get(cacheKey);
  if (cachedMemory !== undefined) {
    return cachedMemory;
  }

  // Check localStorage cache
  const cachedStorage = loadFromStorage<Author[]>(cacheKey, CACHE_TTL);
  if (cachedStorage !== undefined) {
    authorCache.set(cacheKey, cachedStorage);
    return cachedStorage;
  }

  // Use deduplication to prevent duplicate in-flight requests
  return deduplicatedFetch(cacheKey, async () => {
    await rateLimit();

    try {
      // Search for podcasts and group by artist
      const url = new URL(`${ITUNES_API_BASE}/search`);
      url.searchParams.append('term', term);
      url.searchParams.append('media', 'podcast');
      url.searchParams.append('entity', 'podcast');
      url.searchParams.append('limit', String(limit));
      url.searchParams.append('attribute', 'artistTerm');
      url.searchParams.append('country', 'US');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data: ITunesSearchResponse = await response.json();

      // Group podcasts by artist
      const artistMap = new Map<string, { result: ITunesResult; podcasts: ITunesResult[] }>();

      data.results.forEach(result => {
        const artistName = result.artistName || 'Unknown Artist';
        const artistId = String(result.artistId || artistName);

        if (!artistMap.has(artistId)) {
          artistMap.set(artistId, { result, podcasts: [] });
        }
        artistMap.get(artistId)!.podcasts.push(result);
      });

      // Convert to Author objects
      const results = Array.from(artistMap.values())
        .map(({ result, podcasts }) => mapITunesResultToAuthor(result, podcasts.length))
        .filter(author => author.name.toLowerCase().includes(term.toLowerCase()));

      // Cache the results
      authorCache.set(cacheKey, results);
      saveToStorage(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Error searching authors:', error);
      throw error;
    }
  });
}

// Media types available in iTunes Search API
export const ITUNES_MEDIA_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'music', label: 'Music' },
  { value: 'musicVideo', label: 'Music Videos' },
  { value: 'audiobook', label: 'Audiobooks' },
  { value: 'shortFilm', label: 'Short Films' },
  { value: 'tvShow', label: 'TV Shows' },
  { value: 'software', label: 'Software' },
  { value: 'ebook', label: 'eBooks' },
] as const;

export type ITunesMediaType = typeof ITUNES_MEDIA_TYPES[number]['value'];

export interface SearchAllOptions {
  term: string;
  media?: ITunesMediaType;
  limit?: number;
  country?: string;
}

export async function searchAll(options: SearchAllOptions): Promise<ITunesGenericSearchResponse> {
  const { term, media = 'all', limit = 50, country = 'US' } = options;

  if (!term.trim()) {
    return { resultCount: 0, results: [] };
  }

  const cacheKey = generateCacheKey('all', term, { media, limit, country });

  // Check memory cache first
  const cachedMemory = allCache.get(cacheKey);
  if (cachedMemory !== undefined) {
    return cachedMemory;
  }

  // Check localStorage cache
  const cachedStorage = loadFromStorage<ITunesGenericSearchResponse>(cacheKey, CACHE_TTL);
  if (cachedStorage !== undefined) {
    allCache.set(cacheKey, cachedStorage);
    return cachedStorage;
  }

  // Use deduplication to prevent duplicate in-flight requests
  return deduplicatedFetch(cacheKey, async () => {
    await rateLimit();

    try {
      const url = new URL(`${ITUNES_API_BASE}/search`);
      url.searchParams.append('term', term);
      url.searchParams.append('media', media);
      url.searchParams.append('limit', String(limit));
      url.searchParams.append('country', country);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data: ITunesGenericSearchResponse = await response.json();

      // Cache the results
      allCache.set(cacheKey, data);
      saveToStorage(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error searching iTunes:', error);
      throw error;
    }
  });
}
