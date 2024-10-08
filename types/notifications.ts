// Imports:
import { FieldValue } from 'firebase/firestore'
import type { CommentID, ReplyID, ReportID } from './comments-and-replies'
import type { URLHash } from './websites'
import type { UID } from './user'

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
  UnfollowUser = 'UnfollowUser',
  RemoveFollower = 'RemoveFollower',
  CommentReportResult = 'CommentReportResult',
  ReplyReportResult = 'ReplyReportResult',
}

/**
 * The base notification interface.
 */
export interface _Notification {
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
   * When this notification was created.
   */
  createdAt: FieldValue
}

/**
 * The notification interface that shows a comment.
 */
export interface ShowCommentNotification extends _Notification {
  /**
   * The action that takes place when the notification is clicked.
   */
  action: NotificationAction.ShowComment

  /**
   * The payload contains information to carry out `Notification.Payload`
   */
  payload: {
    URLHash: URLHash
    commentID: CommentID
  }
}

/**
 * The notification interface that shows a reply.
 */
export interface ShowReplyNotification extends _Notification {
  /**
   * The action that takes place when the notification is clicked.
   */
  action: NotificationAction.ShowReply

  /**
   * The payload contains information to carry out `Notification.Payload`
   */
  payload: {
    URLHash: URLHash
    commentID: CommentID
    replyID: ReplyID
  }
}

/**
 * The notification interface that shows a user.
 */
export interface ShowUserNotification extends Omit<_Notification, 'body'> {
  /**
   * The action that takes place when the notification is clicked.
   */
  action: NotificationAction.ShowUser

  /**
   * The body for the notification here is optional.
   */
  body?: string

  /**
   * The payload contains information to carry out `Notification.Payload`
   */
  payload: {
    UID: UID
  }
}

/**
 * The silent notification interface when a user is unfollowed.
 */
export interface UnfollowUserNotification extends Omit<_Notification, 'type' | 'title' | 'body'> {
  /**
   * The type of the notification.
   */
  type: NotificationType.Silent

  /**
   * The action that takes place when the notification is received.
   */
  action: NotificationAction.UnfollowUser

  /**
   * The payload contains information to carry out `Notification.Payload`
   */
  payload: {
    UID: UID
  }
}

/**
 * The silent notification interface when a follower is removed.
 */
export interface RemoveFollowerUserNotification extends Omit<_Notification, 'type' | 'title' | 'body'> {
  /**
   * The type of the notification.
   */
  type: NotificationType.Silent

  /**
   * The action that takes place when the notification is received.
   */
  action: NotificationAction.RemoveFollower

  /**
   * The payload contains information to carry out `Notification.Payload`
   */
  payload: {
    UID: UID
  }
}

/**
 * The notification interface alerts a user regarding a reported comment.
 */
export interface CommentReportNotification extends Omit<_Notification, 'type' | 'body'> {
  /**
   * The type of the notification.
   */
  type: NotificationType.Visible

  /**
   * The action that takes place when the notification is clicked.
   */
  action: NotificationAction.CommentReportResult

  /**
   * The payload contains information to carry out `Notification.Payload`
   */
  payload: {
    URLHash: URLHash
    commentID: CommentID
    reportID: ReportID
  }
}

/**
 * The notification interface alerts a user regarding a reported reply.
 */
export interface ReplyReportNotification extends Omit<_Notification, 'type' | 'body'> {
  /**
   * The type of the notification.
   */
  type: NotificationType.Visible

  /**
   * The action that takes place when the notification is clicked.
   */
  action: NotificationAction.ReplyReportResult

  /**
   * The payload contains information to carry out `Notification.Payload`
   */
  payload: {
    URLHash: URLHash
    commentID: CommentID
    replyID: ReplyID
    reportID: ReportID
  }
}

export type Notification =
  ShowCommentNotification |
  ShowReplyNotification |
  ShowUserNotification |
  UnfollowUserNotification |
  RemoveFollowerUserNotification |
  CommentReportNotification |
  ReplyReportNotification
