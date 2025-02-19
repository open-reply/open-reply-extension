// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { NotificationID } from 'types/notifications'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Get the current user's unread notification count.
 */
export const getLastReadNotificationID = async (): Promise<Returnable<NotificationID | null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<NotificationID | null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.notifications.get.getLastReadNotificationID,
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
      functionName: 'getLastReadNotificationID',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

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
