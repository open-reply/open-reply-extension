// Packages:
import { auth } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import fetchWith from '@/entrypoints/background/utils/fetchWith'
import { getCachedUserPrerences, setCachedUserPrerences } from '@/entrypoints/background/localforage/user-preferences'
import { _getFirestoreUser } from '../user/get'

// Typescript:
import { FetchPolicy, type Returnable } from 'types/index'
import type { FirestoreDatabaseUser } from 'types/firestore.database'
import type { UID } from 'types/user'

// Exports:
/**
 * Get the user's preferences.
 */
export const _getUserPreferences = async ({
  fetchPolicy,
}: {
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<FirestoreDatabaseUser['preferences'] | null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    if (!fetchPolicy) fetchPolicy = FetchPolicy.NetworkIfCacheExpired
    const response = await fetchWith({
      cacheGetter: async () => await getCachedUserPrerences(),
      networkGetter: async () => {
        const firestoreUserSnapshotResult = await _getFirestoreUser(auth.currentUser?.uid as UID)
        if (!firestoreUserSnapshotResult.status) throw firestoreUserSnapshotResult.payload
        const firestoreUser = firestoreUserSnapshotResult.payload
        return firestoreUser?.preferences ?? {}
      },
      cacheSetter: async (_userPreferences) => await setCachedUserPrerences(_userPreferences),
      fetchPolicy,
    })

    if (!response.status) throw response.payload
    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_getUserPreferences',
      data: {
        fetchPolicy,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
