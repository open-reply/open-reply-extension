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
 * Mute a user.
 */
export const muteUser = async (UID: UID): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.set.muteUser,
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
      functionName: 'muteUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Unmute a muted user.
 */
export const unmuteUser = async (UID: UID): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.set.unmuteUser,
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
      functionName: 'unmuteUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
