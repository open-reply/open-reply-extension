// Packages:
import { database } from '../..'
import { child, get, ref } from 'firebase/database'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { getCachedRDBUser, setCachedRDBUser } from '@/entrypoints/background/localforage/user'
import fetchWith from '@/entrypoints/background/utils/fetchWith'

// Typescript:
import { type Returnable, FetchPolicy } from 'types'
import type { DataSnapshot } from 'firebase/database'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import type { UID } from 'types/user'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the user snapshot given a UID from the Realtime Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.val()`.
 */
export const _getRDBUserSnapshot = async (UID: UID): Promise<Returnable<DataSnapshot, Error>> => {
  try {
    return returnable.success(await get(child(ref(database), REALTIME_DATABASE_PATHS.USERS.user(UID))))
  } catch (error) {
    logError({
      functionName: '_getRDBUserSnapshot',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the user given a UID from the Realtime Database.
 * 
 * @implements `fetchPolicy` is implemented.
 */
export const _getRDBUser = async ({
  UID,
  fetchPolicy,
}: {
  UID: UID
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<RealtimeDatabaseUser | null, Error>> => {
  try {
    if (!fetchPolicy) fetchPolicy = FetchPolicy.NetworkIfCacheExpired
    const response = await fetchWith({
      cacheGetter: async () => await getCachedRDBUser(UID),
      networkGetter: async () => {
        const userSnapshotResult = await _getRDBUserSnapshot(UID)
        if (!userSnapshotResult.status) throw userSnapshotResult.payload
        return userSnapshotResult.payload.val() as RealtimeDatabaseUser
      },
      cacheSetter: async (RDBUser) => await setCachedRDBUser(UID, RDBUser),
      fetchPolicy,
    })

    if (!response.status) throw response.payload
    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_getRDBUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Check if the username is taken or available.
 */
export const _isUsernameTaken = async (username: string): Promise<Returnable<boolean, Error>> => {
  try {
    const usernameSnapshot = await get(child(ref(database), REALTIME_DATABASE_PATHS.USERS.username(username)))
    return returnable.success(usernameSnapshot.exists())
  } catch (error) {
    logError({
      functionName: '_isUsernameTaken',
      data: username,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
