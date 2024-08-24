// Exports:
export type SuccessReturnable<S> = { status: true, payload: S }

export type FailReturnable<F> = { status: false, payload: F }

export type Returnable<S, F> = SuccessReturnable<S> | FailReturnable<F>

export enum FetchPolicy {
  /**
   * This policy attempts to provide the fastest possible response while ensuring data freshness. It works as follows:
   * - First, it immediately returns data from the cache (if available).
   * - Then, it makes a network request to fetch fresh data.
   * - If the network data differs from the cache, it updates the cache.
   */
  CacheAndNetwork,

  /**
   * This policy prioritizes cached data to reduce network requests:
   * - It first checks the cache for the requested data.
   * - If the data is in the cache, it returns it immediately without making a network request.
   * - If the data is not in the cache, it makes a network request, and caches the result.
   */
  CacheFirst,

  /**
   * This policy relies entirely on cached data:
   * - It only checks the cache for the requested data.
   * - If the data is in the cache, it returns it.
   * - If the data is not in the cache, it returns null.
   * - It never makes network requests.
   */
  CacheOnly,

  /**
   * This policy always fetches fresh data from the network:
   * - It ignores any cached data and always makes a network request.
   * - After receiving the response, it caches the new data and returns it.
   */
  NetworkOnly,

  /**
   * This policy disables caching entirely:
   * - It always makes a network request to fetch data.
   * - It does not read from or write to the cache.
   * - This is useful for data that changes frequently or should never be stored.
   */
  NoCache,

  /**
   * This policy is like `CacheFirst`, but also fetches from the network:
   * - It first checks the cache for the requested data.
   * - If the data is in the cache and has not expired, then it returns it immediately without making a network request.
   * - If the data is not in the cache or has expired, it makes a network request, and caches the result.
   */
  NetworkIfCacheExpired,
}
