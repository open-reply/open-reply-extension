// Packages:
import logError from 'utils/logError'
import returnable from 'utils/returnable'
import { AVERAGE_MONTH } from 'time-constants'
import { omit } from 'lodash'

// Typescript:
import { type Returnable, FetchPolicy } from 'types/index'
import { type Local } from '@/entrypoints/background/localforage'

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

const fetchWith = async <C, N>({
  cacheGetter,
  networkGetter,
  cacheSetter,
  fetchPolicy,
  cacheExpiryAfter = AVERAGE_MONTH,
}: {
  cacheGetter: () => Promise<Local<NonNullable<C>> | null>
  networkGetter: () => Promise<N>
  cacheSetter?: (networkResult: N) => Promise<void>
  fetchPolicy: FetchPolicy
  cacheExpiryAfter?: number
}): Promise<Returnable<NonNullable<C> | null, Error> | Returnable<N, Error>> => {
  try {
    if (fetchPolicy === FetchPolicy.CacheAndNetwork) {
      if (!cacheSetter) throw new Error('Setting `fetchPolicy` to `FetchPolicy.CacheAndNetwork` requires `cacheSetter` to be passed to `fetchWith`.')
      const cacheResult = omit(await cacheGetter(), ['_lastUpdatedLocally']) as Awaited<NonNullable<C>>
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
      if (!cacheSetter) throw new Error('Setting `fetchPolicy` to `FetchPolicy.CacheFirst` requires `cacheSetter` to be passed to `fetchWith`.')
      const cacheResult = omit(await cacheGetter(), ['_lastUpdatedLocally']) as Awaited<NonNullable<C>>
      if (cacheResult) return returnable.success(cacheResult)
      else {
        const networkResult = await fetchAndCache({ networkGetter, cacheSetter })
        return returnable.success(networkResult)
      }
    } else if (fetchPolicy === FetchPolicy.CacheOnly) {
      const cacheResult = omit(await cacheGetter(), ['_lastUpdatedLocally']) as Awaited<NonNullable<C>>
      return returnable.success(cacheResult)
    } else if (fetchPolicy === FetchPolicy.NetworkOnly) {
      if (!cacheSetter) throw new Error('Setting `fetchPolicy` to `FetchPolicy.NetworkOnly` requires `cacheSetter` to be passed to `fetchWith`.')
      const networkResult = await fetchAndCache({
        networkGetter,
        cacheSetter,
      })
      return returnable.success(networkResult)
    } else if (fetchPolicy === FetchPolicy.NoCache) {
      const networkResult = await networkGetter()
      return returnable.success(networkResult)
    } else if (fetchPolicy === FetchPolicy.NetworkIfCacheExpired) {
      if (!cacheSetter) throw new Error('Setting `fetchPolicy` to `FetchPolicy.NetworkIfCacheExpired` requires `cacheSetter` to be passed to `fetchWith`.')
      const cacheResult = await cacheGetter()
      const _lastUpdatedLocally = (cacheResult as Local<Awaited<NonNullable<C>>> | null)?._lastUpdatedLocally
      const hasCacheExpired = _lastUpdatedLocally ? (Date.now() - _lastUpdatedLocally) > cacheExpiryAfter : true
      if (cacheResult && !hasCacheExpired) {
        return returnable.success(omit(cacheResult, ['_lastUpdatedLocally']) as Awaited<NonNullable<C>>)
      } else {
        const networkResult = await fetchAndCache({
          networkGetter,
          cacheSetter,
        })
        return returnable.success(networkResult)
      }

    } else throw new Error(`Invalid \`fetchPolicy\` passed: ${ fetchPolicy }`)
    
    // NOTE: This code is unreachable, too unbothered to fix TS right now.
    return returnable.fail(new Error(`Invalid \`fetchPolicy\` passed: ${ fetchPolicy }`))
  } catch (error) {
    logError({
      functionName: 'fetchWith',
      data: null,
      error: error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

// Exports:
export default fetchWith
