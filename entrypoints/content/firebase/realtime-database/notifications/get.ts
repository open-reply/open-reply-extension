// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Get the current user's unread notification count.
 */
export const getUnreadNotificationsCount = async (): Promise<Returnable<number, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<number, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.notifications.get.getUnreadNotificationsCount,
          payload: null,
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
      functionName: 'getUnreadNotificationsCount',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
