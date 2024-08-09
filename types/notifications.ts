// Exports:
/**
 * Defines the Notification ID, only useful for development.
 */
export type NotificationID = string

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
}
