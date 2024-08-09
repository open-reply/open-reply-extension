// Imports:
import { FieldValue } from 'firebase/firestore'

// Exports:
/**
 * Defines the Notification ID, only useful for development.
 */
export type NotificationID = string

/**
 * The type of the notification.
 */
export enum NotificationType {
  Visible = 'Visible',
  Silent = 'Silent',
}

/**
 * Types of notifications.
 * 
 * NOTE: This list is temporary, and will grow and get more refined.
 */
export enum NotificationAction {
  ShowComment = 'ShowComment',
  ShowReply = 'ShowReply',
  ShowUser = 'ShowUser',
}

// TODO: Integrate FCM and write definitions.
export interface Notification {
  /**
   * The ID of the notification.
   */
  id: NotificationID

  /**
   * The type of the notification.
   */
  type: NotificationType

  /**
   * The title of the notification.
   */
  title: string

  /**
   * The body of the notification.
   */
  body: string

  /**
   * The action that takes place when the notification is clicked.
   */
  action: string

  /**
   * A JSON-encoded payload that contains information to carry out `Notification.Payload`
   */
  payload: string

  /**
   * When this notification was created.
   */
  createdAt: FieldValue
}
