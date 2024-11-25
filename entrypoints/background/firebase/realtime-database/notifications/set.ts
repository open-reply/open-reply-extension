// Packages:
import { functions } from '../..'
import { httpsCallable } from 'firebase/functions'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { getCachedLastReadNotificationID, setCachedLastReadNotificationID } from '@/entrypoints/background/localforage/notifications'

// Typescript:
import { type Returnable } from 'types'
import type { NotificationID } from 'types/notifications'

// Exports:
/**
 * Set the current user's last read notification ID.
 */
export const _setLastReadNotificationID = async (notificationID: NotificationID): Promise<Returnable<NotificationID | null, Error>> => {
  const _cachedLastReadNotificationID = await getCachedLastReadNotificationID()

  try {
    if (_cachedLastReadNotificationID === notificationID) return returnable.success(null)
    else await setCachedLastReadNotificationID(notificationID)

    const setLastReadNotificationID = httpsCallable(functions, 'setLastReadNotificationID')

    const response = (await setLastReadNotificationID(notificationID)).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_setLastReadNotificationID',
      data: null,
      error,
    })

    await setCachedLastReadNotificationID(_cachedLastReadNotificationID)

    return returnable.fail(error as unknown as Error)
  }
}
