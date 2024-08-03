// Packages:
import { database } from '../..'
import { child, get, ref } from 'firebase/database'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { getCachedRDBUser, setCachedRDBUser } from '@/entrypoints/content/localforage/user'
import fetchWith from '@/entrypoints/content/utils/fetchWith'

// Typescript:
import type { Returnable } from 'types/index'
import type { DataSnapshot } from 'firebase/database'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { FetchPolicy } from '../../type'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the user snapshot given a UID from the Realtime Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.val()`.
 */
export const getRDBUserSnapshot = async (UID: string): Promise<Returnable<DataSnapshot, Error>> => {
  try {
    return returnable.success(await get(child(ref(database), REALTIME_DATABASE_PATHS.USERS.user(UID))))
  } catch (error) {
    logError({
      functionName: 'getRDBUserSnapshot',
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
export const getRDBUser = async (UID: string, fetchPolicy: FetchPolicy = FetchPolicy.NetworkIfCacheExpired): Promise<Returnable<RealtimeDatabaseUser | null, Error>> => {
  try {
    const response = await fetchWith({
      cacheGetter: async () => await getCachedRDBUser(UID),
      networkGetter: async () => {
        const userSnapshotResult = await getRDBUserSnapshot(UID)
        if (!userSnapshotResult.status) throw userSnapshotResult.payload
        return userSnapshotResult.payload as RealtimeDatabaseUser
      },
      cacheSetter: async (RDBUser) => await setCachedRDBUser(UID, RDBUser),
      fetchPolicy,
    })

    if (!response.status) throw response.payload
    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: 'getRDBUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
