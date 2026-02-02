import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { AuthorCard } from "@/components/AuthorCard";
import { useFavorites } from "@/hooks/useFavorites";
import { searchAuthors } from "@/lib/itunesApi";
import type { Author } from "@/types";

export function AuthorSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [searchResults, setSearchResults] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getFavoriteCount, favorites } = useFavorites();

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setSearchedQuery(query);
    setIsLoading(true);
    setError(null);

    try {
      const results = await searchAuthors(query, 50);
      setSearchResults(results);
    } catch {
      setError('Failed to search authors. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);
  
  // Get favorites for display
  const favoriteAuthors = Array.from(favorites.authors)
    .map(id => searchResults.find(a => a.id === id))
    .filter((a): a is Author => a !== undefined);

  // Only show results if user has searched or is viewing favorites
  const displayedResults = !searchedQuery && !showOnlyFavorites
    ? []
    : showOnlyFavorites
    ? favoriteAuthors
    : searchResults;
  
  const favoriteCount = getFavoriteCount('author');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Search by Author</h1>
        </div>

        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search authors by name, bio, or genre..."
            isLoading={isLoading}
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
              {displayedResults.map(author => (
                <AuthorCard key={author.id} {...author} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {!searchedQuery && !showOnlyFavorites
                  ? "Enter a search term and press Search or Enter..."
                  : showOnlyFavorites
                  ? favoriteAuthors.length === 0
                    ? "No favorites yet. Click the heart to save authors."
                    : searchedQuery
                    ? `No favorited authors match "${searchedQuery}".`
                    : "No favorites yet. Click the heart to save authors."
                  : `No authors found for "${searchedQuery}". Try a different search.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
