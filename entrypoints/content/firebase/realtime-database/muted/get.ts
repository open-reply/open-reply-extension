// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types'
import type { UID } from 'types/user'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Get a list of all the users muted by the authenticated user.
 * 
 * Note: This loads **all** the muted users, without any pagination or limiting.
 */
export const getAllMutedUsers = async (): Promise<Returnable<UID[], Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<UID[], Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.get.getAllMutedUsers,
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
      functionName: 'getAllMutedUsers',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Checks if the signed-in user has muted a user.
 */
export const isUserMuted = async (UID: UID): Promise<Returnable<boolean, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<boolean, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.get.isUserMuted,
          payload: UID,
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
      functionName: 'isUserMuted',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
