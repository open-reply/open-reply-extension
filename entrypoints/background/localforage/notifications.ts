// Packages:
import localforage from 'localforage'
import { omit } from 'lodash'

// Typescript:
import type { UID } from 'types/user'
import type { Notification, NotificationID } from 'types/notifications'
import type { Local } from '.'
import { Timestamp } from 'firebase/firestore'

// Constants:
import { LOCAL_FORAGE_SCHEMA } from '.'
import { MAX_LOCAL_NOTIFICATION_COUNT, STABLE_LOCAL_NOTIFICATION_COUNT } from 'constants/database/notifications'

// Functions:
const pruneNotifications = async () => {
  const notifications = await getCachedNotifications()
  const notificationList = Object
    .entries(notifications)
    .map(([ notificationID, notification ]) => ({
      id: notificationID,
      ...notification,
    }))
    .sort((notificationA, notificationB) => (notificationB.createdAt as Timestamp).toMillis() - (notificationA.createdAt as Timestamp).toMillis())
  notificationList.slice(0, STABLE_LOCAL_NOTIFICATION_COUNT)
  const newNotifications = {} as Record<string, Local<Notification>>

  for (const notification of notificationList) {
    newNotifications[notification.id] = { ...omit(notification, 'id') } as Local<Notification>
  }

  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USERS, newNotifications)
}

// Exports:
/**
 * Fetch all the notifications that have been cached locally.
 */
export const getCachedNotifications = async (): Promise<Record<NotificationID, Local<Notification>>> => {
  const notifications = await localforage.getItem<Record<UID, Local<Notification>>>(LOCAL_FORAGE_SCHEMA.NOTIFICATIONS)
  return notifications ? notifications : {}
}

/**
 * Fetch an array of all the notifications that have been cached locally.
 */
export const getCachedNotificationsList = async (orderBy: FirebaseFirestore.OrderByDirection = 'desc') => {
  const notificationsRecord = await getCachedNotifications()
  let notifications: Local<Notification>[] = Object.values(notificationsRecord) ?? []

  if (orderBy === 'desc') {
    notifications = notifications
      .sort((notificationA, notificationB) => (notificationB.createdAt as Timestamp).toMillis() - (notificationA.createdAt as Timestamp).toMillis())
  } else {
    notifications = notifications
      .sort((notificationA, notificationB) => (notificationA.createdAt as Timestamp).toMillis() - (notificationB.createdAt as Timestamp).toMillis())
  }

  return notifications
}

/**
 * Cache a user from Realtime Database locally.
 */
export const setCachedNotification = async (notificationID: NotificationID, notification: Notification) => {
  const notifications = await getCachedNotifications()
  notifications[notificationID] = { ...notification, _lastUpdatedLocally: Date.now() }
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USERS, notifications)

  const cachedNotificationCount = Object.keys(notifications).length
  if (cachedNotificationCount > MAX_LOCAL_NOTIFICATION_COUNT) await pruneNotifications()
}

/**
 * Gets the cached last read notification ID.
 */
export const getCachedLastReadNotificationID = async (): Promise<NotificationID | null> => {
  const lastReadNotificationID = await localforage.getItem<NotificationID>(LOCAL_FORAGE_SCHEMA.LAST_READ_NOTIFICATION_ID)
  return lastReadNotificationID ? lastReadNotificationID : null
}

/**
 * Sets the cached last read notification ID.
 */
export const setCachedLastReadNotificationID = async (notificationID: NotificationID | null) => {
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.LAST_READ_NOTIFICATION_ID, notificationID)
}
