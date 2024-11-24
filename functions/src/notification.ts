// Packages:
import { auth, database, firestore } from './config'
import { v4 as uuidv4 } from 'uuid'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'

// Typescript:
import type { Returnable } from 'types/index'
import type { Notification, NotificationID } from 'types/notifications'
import type { UID } from 'types/user'
import { ServerValue } from 'firebase-admin/database'
import type { CallableContext } from 'firebase-functions/v1/https'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_NOTIFICATION_DOCUMENT_COUNT, STABLE_NOTIFICATION_DOCUMENT_COUNT } from 'constants/database/notifications'

// Exports:
export const pruneNotifications = async (UID: UID, notificationCount: number): Promise<Returnable<null, Error>> => {
  try {
    const deleteCount = notificationCount - MAX_NOTIFICATION_DOCUMENT_COUNT + STABLE_NOTIFICATION_DOCUMENT_COUNT
    const querySnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.NOTIFICATIONS.INDEX)
      .orderBy('createdAt')
      .limit(deleteCount)
      .get()

    const batch = firestore.batch()
    querySnapshot.docs.forEach(notificationSnapshot => batch.delete(notificationSnapshot.ref))
    await batch.commit()

    await database
      .ref(REALTIME_DATABASE_PATHS.NOTIFICATIONS.notificationCount(UID))
      .update(ServerValue.increment(-deleteCount))

    return returnable.success(null)
  } catch (error) {
    logError({ data: null, error, functionName: 'pruneNotifications' })
    return returnable.fail(error as Error)
  }
}

/**
 * Add a notification to the user's sub-collection and update notificationCount.
 */
export const addNotification = async (UID: UID, notification: Notification): Promise<Returnable<null, Error>> => {
  try {
    const notificationID = uuidv4() as NotificationID

    // Add notification to the user's sub-collection
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.NOTIFICATIONS.INDEX).doc(notificationID)
      .set(notification)
    
    // Increment the notification count of the user.
    await database
      .ref(REALTIME_DATABASE_PATHS.NOTIFICATIONS.notificationCount(UID))
      .set(ServerValue.increment(1))

    // Increment the unread notification count of the user.
    await database
      .ref(REALTIME_DATABASE_PATHS.NOTIFICATIONS.unreadCount(UID))
      .set(ServerValue.increment(1))

    const notificationCount = (await database
      .ref(REALTIME_DATABASE_PATHS.NOTIFICATIONS.notificationCount(UID))
      .get()).val() as number ?? 0

    if (notificationCount > MAX_NOTIFICATION_DOCUMENT_COUNT) await pruneNotifications(UID, notificationCount)

    return returnable.success(null)
  } catch (error) {
    logError({ data: notification, error, functionName: 'addNotification' })
    return returnable.fail(error as Error)
  }
}

/**
 * Set the current user's last read notification ID.
 */
export const setLastReadNotificationID = async (
  data: NotificationID,
  context: CallableContext
) => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)
    
    // Set the last read notification ID.
    await database
      .ref(REALTIME_DATABASE_PATHS.NOTIFICATIONS.lastRead(UID))
      .set(data)

    // Reset the unread notification count of the user.
    await database
      .ref(REALTIME_DATABASE_PATHS.NOTIFICATIONS.unreadCount(UID))
      .set(0)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'setLastReadNotificationID' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
