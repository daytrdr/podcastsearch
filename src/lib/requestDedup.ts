/**
 * Request deduplication to prevent duplicate in-flight requests
 *
 * When multiple components request the same data simultaneously,
 * this ensures only one actual API call is made.
 */

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Execute a fetch operation with deduplication.
 * If a request with the same key is already in-flight, return its promise.
 *
 * @param key - Unique identifier for this request
 * @param fetcher - Function that performs the actual fetch
 * @returns Promise resolving to the fetched data
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request for this key
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  // Create a new request and track it
  const request = fetcher()
    .finally(() => {
      // Clean up after request completes (success or failure)
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);

  return request;
}

/**
 * Check if a request is currently in-flight
 */
export function isRequestPending(key: string): boolean {
  return pendingRequests.has(key);
}

/**
 * Get the number of pending requests (useful for debugging)
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}

/**
 * Clear all pending requests (useful for testing or cleanup)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}
