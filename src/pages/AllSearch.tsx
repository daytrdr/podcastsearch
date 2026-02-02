import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, ExternalLink, Image as ImageIcon } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { searchAll, ITUNES_MEDIA_TYPES } from "@/lib/itunesApi";
import type { ITunesMediaType, ITunesRawResult } from "@/lib/itunesApi";

function formatValue(value: unknown, key: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (typeof value === 'boolean') {
    return <Badge variant={value ? "default" : "secondary"}>{value ? 'true' : 'false'}</Badge>;
  }

  if (typeof value === 'number') {
    // Format milliseconds as duration
    if (key.toLowerCase().includes('millis') || key.toLowerCase().includes('duration')) {
      const totalSeconds = Math.floor(value / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const formatted = hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
      return (
        <span>
          <span className="font-mono">{value.toLocaleString()}</span>
          <span className="text-muted-foreground ml-2">({formatted})</span>
        </span>
      );
    }
    // Format prices
    if (key.toLowerCase().includes('price')) {
      return <span className="font-mono">${value.toFixed(2)}</span>;
    }
    return <span className="font-mono">{value.toLocaleString()}</span>;
  }

  if (typeof value === 'string') {
    // Check if it's a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      // Check if it's an image URL
      if (key.toLowerCase().includes('artwork') || key.toLowerCase().includes('image')) {
        return (
          <div className="space-y-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all text-xs flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              {value}
            </a>
            <img
              src={value}
              alt={key}
              className="max-w-32 max-h-32 rounded-md border object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );
      }
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all text-xs flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
          {value}
        </a>
      );
    }

    // Check if it's a date
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return (
          <span>
            <span>{value}</span>
            <span className="text-muted-foreground ml-2">({date.toLocaleDateString()})</span>
          </span>
        );
      }
    }

    // Long text gets special treatment
    if (value.length > 200) {
      return <p className="text-sm whitespace-pre-wrap">{value}</p>;
    }

    return <span className="break-words">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">[]</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, i) => (
          <Badge key={i} variant="outline" className="text-xs">
            {String(item)}
          </Badge>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span>{String(value)}</span>;
}

function ResultCard({ result, index }: { result: ITunesRawResult; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get display info
  const title = (result.trackName || result.collectionName || result.artistName || 'Unknown') as string;
  const subtitle = (result.artistName || result.collectionName || '') as string;
  const kind = (result.kind || result.wrapperType || 'unknown') as string;
  const artworkUrl = (result.artworkUrl100 || result.artworkUrl60 || result.artworkUrl600) as string | undefined;

  // Sort keys for display - important ones first
  const priorityKeys = [
    'wrapperType', 'kind', 'trackId', 'collectionId', 'artistId',
    'trackName', 'collectionName', 'artistName',
    'artworkUrl600', 'artworkUrl100', 'artworkUrl60',
    'trackViewUrl', 'collectionViewUrl', 'artistViewUrl',
    'previewUrl', 'feedUrl',
    'primaryGenreName', 'genres', 'genreIds',
    'releaseDate', 'trackTimeMillis',
    'trackPrice', 'collectionPrice', 'trackCount',
    'description', 'longDescription', 'shortDescription',
  ];

  const allKeys = Object.keys(result);
  const sortedKeys = [
    ...priorityKeys.filter(k => allKeys.includes(k)),
    ...allKeys.filter(k => !priorityKeys.includes(k)).sort()
  ];

  const previewKeys = sortedKeys.slice(0, 8);
  const remainingKeys = sortedKeys.slice(8);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-4">
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt={title}
              className="w-16 h-16 rounded-md object-cover flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                #{index + 1}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {kind}
              </Badge>
            </div>
            <CardTitle className="text-base truncate">{title}</CardTitle>
            {subtitle && subtitle !== title && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {previewKeys.map(key => (
            <div key={key} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <span className="font-mono text-muted-foreground text-xs truncate" title={key}>
                {key}
              </span>
              <div className="min-w-0">
                {formatValue(result[key], key)}
              </div>
            </div>
          ))}

          {remainingKeys.length > 0 && (
            <>
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t">
                  {remainingKeys.map(key => (
                    <div key={key} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                      <span className="font-mono text-muted-foreground text-xs truncate" title={key}>
                        {key}
                      </span>
                      <div className="min-w-0">
                        {formatValue(result[key], key)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show less ({remainingKeys.length} fields)
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show {remainingKeys.length} more fields
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AllSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [mediaType, setMediaType] = useState<ITunesMediaType>('all');
  const [results, setResults] = useState<ITunesRawResult[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setSearchedQuery(query);
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchAll({
        term: query,
        media: mediaType,
        limit: 50,
      });
      setResults(response.results);
      setResultCount(response.resultCount);
    } catch {
      setError('Failed to search iTunes. Please try again.');
      setResults([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, mediaType]);

  // Get unique wrapper types and kinds for stats
  const wrapperTypes = [...new Set(results.map(r => r.wrapperType as string).filter(Boolean))];
  const kinds = [...new Set(results.map(r => r.kind as string).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">iTunes Search API Explorer</h1>
            <p className="text-muted-foreground text-sm">
              Search across all iTunes content and view complete API response data
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                placeholder="Search for anything in iTunes..."
                isLoading={isLoading}
              />
            </div>
            <Select value={mediaType} onValueChange={(value) => setMediaType(value as ITunesMediaType)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Media type" />
              </SelectTrigger>
              <SelectContent>
                {ITUNES_MEDIA_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {wrapperTypes.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Types:</span>
                  {wrapperTypes.map(type => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
              {kinds.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Kinds:</span>
                  {kinds.map(kind => (
                    <Badge key={kind} variant="secondary" className="text-xs">
                      {kind}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                searchedQuery && (
                  <span>
                    {resultCount} result{resultCount !== 1 ? 's' : ''} returned
                  </span>
                )
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
          ) : results.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {results.map((result, index) => (
                <ResultCard
                  key={`${result.trackId || result.collectionId || result.artistId || index}`}
                  result={result}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {!searchedQuery
                  ? "Enter a search term and press Search or Enter..."
                  : `No results found for "${searchedQuery}". Try a different search or media type.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
