// Packages:
import { database, firestore } from './config'
import { v4 as uuidv4 } from 'uuid'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { Notification, NotificationID } from 'types/notifications'
import type { UID } from 'types/user'
import { ServerValue } from 'firebase-admin/database'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
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
      .update(ServerValue.increment(1))

    return returnable.success(null)
  } catch (error) {
    logError({ data: notification, error, functionName: 'addNotification' })
    return returnable.fail(error as Error)
  }
}
