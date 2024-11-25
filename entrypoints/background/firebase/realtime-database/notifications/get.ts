// Packages:
import { auth, database } from '../..'
import { child, get, ref } from 'firebase/database'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'

// Typescript:
import { type Returnable } from 'types'
import type { NotificationID } from 'types/notifications'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Get the current user's last read notification ID.
 */
export const _getLastReadNotificationID = async (): Promise<Returnable<NotificationID | null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const lastReadNotificationID = (await get(child(ref(database), REALTIME_DATABASE_PATHS.NOTIFICATIONS.lastRead(auth.currentUser.uid)))).val() ?? null

    return returnable.success(lastReadNotificationID)
  } catch (error) {
    logError({
      functionName: '_getLastReadNotificationID',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Get the current user's unread notification count.
 */
export const _getUnreadNotificationsCount = async (): Promise<Returnable<number | null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const unreadNotificationsCount = (await get(child(ref(database), REALTIME_DATABASE_PATHS.NOTIFICATIONS.unreadCount(auth.currentUser.uid)))).val() ?? null

    return returnable.success(unreadNotificationsCount)
  } catch (error) {
    logError({
      functionName: '_getUnreadNotificationsCount',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
