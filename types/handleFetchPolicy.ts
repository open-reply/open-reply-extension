// Packages:
import logError from '@/entrypoints/content/utils/logError'
import returnable from '@/entrypoints/content/utils/returnable'

// Typescript:
import { FetchPolicy } from '@/entrypoints/content/firebase/type'
import type { Returnable } from '@/entrypoints/content/types'

// Functions:
const fetchAndCache = async <N>({
  networkGetter,
  cacheSetter,
  awaitCacheSetter = true,
}: {
  networkGetter: () => Promise<N>
  cacheSetter: (networkResult: N) => Promise<void>
  awaitCacheSetter?: boolean
}) => {
  const networkResult = await networkGetter()
  if (awaitCacheSetter) await cacheSetter(networkResult)
  else cacheSetter(networkResult)
  return networkResult
}

const handleFetchPolicy = async <C, N>({
  cacheGetter,
  networkGetter,
  cacheSetter,
  fetchPolicy,
}: {
  cacheGetter: () => Promise<NonNullable<C> | null>
  networkGetter: () => Promise<N>
  cacheSetter?: (networkResult: N) => Promise<void>
  fetchPolicy: FetchPolicy
}): Promise<Returnable<NonNullable<C> | null, Error> | Returnable<N, Error>> => {
  try {
    if (fetchPolicy === FetchPolicy.CacheAndNetwork) {
      if (!cacheSetter) throw new Error('Setting `fetchPolicy` to `FetchPolicy.CacheAndNetwork` requires `cacheSetter` to be passed to `handleFetchPolicy`.')
      const cacheResult = await cacheGetter()
      if (!cacheResult) {
        const networkResult = await fetchAndCache({
          networkGetter,
          cacheSetter,
          awaitCacheSetter: false,  // awaitCacheSetter is false here to ensure speed by not waiting for the cache to be updated.
        })
        return returnable.success(networkResult)
      } else {
        fetchAndCache({ networkGetter, cacheSetter })
        return returnable.success(cacheResult)
      }
    } else if (fetchPolicy === FetchPolicy.CacheFirst) {
      if (!cacheSetter) throw new Error('Setting `fetchPolicy` to `FetchPolicy.CacheFirst` requires `cacheSetter` to be passed to `handleFetchPolicy`.')
      const cacheResult = await cacheGetter()
      if (cacheResult) return returnable.success(cacheResult)
      else {
        const networkResult = await fetchAndCache({ networkGetter, cacheSetter })
        return returnable.success(networkResult)
      }
    } else if (fetchPolicy === FetchPolicy.CacheOnly) {
      const cacheResult = await cacheGetter()
      returnable.success(cacheResult)
    } else if (fetchPolicy === FetchPolicy.NetworkOnly) {
      if (!cacheSetter) throw new Error('Setting `fetchPolicy` to `FetchPolicy.NetworkOnly` requires `cacheSetter` to be passed to `handleFetchPolicy`.')
      const networkResult = await fetchAndCache({
        networkGetter,
        cacheSetter,
      })
      return returnable.success(networkResult)
    } else if (fetchPolicy === FetchPolicy.NoCache) {
      const networkResult = await networkGetter()
      return returnable.success(networkResult)
    } else throw new Error(`Invalid \`fetchPolicy\` passed: ${ fetchPolicy }`)
    // TODO: Add getCachedRDBUserLastUpdated
    // NOTE: This code is unreachable, too unbothered to fix TS right now.
    return returnable.fail(new Error(`Invalid \`fetchPolicy\` passed: ${ fetchPolicy }`))
  } catch (error) {
    logError({
      functionName: 'handleFetchPolicy',
      data: null,
      error: error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

// Exports:
export default handleFetchPolicy
