import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { EpisodeCard } from "@/components/EpisodeCard";
import { useFavorites } from "@/hooks/useFavorites";
import { searchEpisodes } from "@/lib/itunesApi";
import type { Episode } from "@/types";

export function EpisodeSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [searchResults, setSearchResults] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getFavoriteCount, favorites } = useFavorites();
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }
    
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const results = await searchEpisodes(debouncedQuery, 50);
        setSearchResults(results);
      } catch (err) {
        setError('Failed to search episodes. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [debouncedQuery]);
  
  // Get favorites for display
  const favoriteEpisodes = Array.from(favorites.episodes)
    .map(id => searchResults.find(e => e.id === id))
    .filter((e): e is Episode => e !== undefined);
  
  // Only show results if user has typed something or is viewing favorites
  const displayedResults = !debouncedQuery && !showOnlyFavorites
    ? []
    : showOnlyFavorites
    ? favoriteEpisodes
    : searchResults;
  
  const favoriteCount = getFavoriteCount('episode');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Search by Episode</h1>
        </div>

        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search episodes by title, podcast, or author..."
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={!showOnlyFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyFavorites(false)}
              >
                All Results
              </Button>
              <Button
                variant={showOnlyFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyFavorites(true)}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Favorites Only
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  {displayedResults.length} result{displayedResults.length !== 1 ? 's' : ''} 
                  {favoriteCount > 0 && ` · ${favoriteCount} favorite${favoriteCount !== 1 ? 's' : ''}`}
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : displayedResults.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedResults.map(episode => (
                <EpisodeCard key={episode.id} {...episode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {!debouncedQuery && !showOnlyFavorites
                  ? "Start typing to search for episodes..."
                  : showOnlyFavorites
                  ? favoriteEpisodes.length === 0
                    ? "No favorites yet. Click the ❤️ to save episodes."
                    : debouncedQuery
                    ? `No favorited episodes match "${debouncedQuery}".`
                    : "No favorites yet. Click the ❤️ to save episodes."
                  : `No episodes found for "${debouncedQuery}". Try a different search.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
