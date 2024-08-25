// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable, FetchPolicy } from 'types'
import type { DataSnapshot } from 'firebase/database'
import type { UID } from 'types/user'
import type { RealtimeDatabaseUser } from 'types/realtime.database'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches the user snapshot given a UID from the Realtime Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.val()`.
 */
export const getRDBUserSnapshot = async (UID: UID): Promise<Returnable<DataSnapshot, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<DataSnapshot, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUserSnapshot,
          payload: UID
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
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
export const getRDBUser = async ({
  UID,
  fetchPolicy,
}: {
  UID: UID
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<RealtimeDatabaseUser | null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<RealtimeDatabaseUser | null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUser,
          payload: { UID, fetchPolicy }
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getRDBUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Check if the username is taken or available.
 */
export const isUsernameTaken = async (username: string): Promise<Returnable<boolean, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<boolean, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.isUsernameTaken,
          payload: username
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'isUsernameTaken',
      data: username,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
