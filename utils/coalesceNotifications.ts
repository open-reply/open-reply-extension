// Typescript:
import type { CommentID, ReplyID } from 'types/comments-and-replies'
import { NotificationAction, type Notification, type NotificationID } from 'types/notifications'

// Functions:
const coalesceNotifications = (notifications: (Notification & { id: NotificationID })[]): (Notification & { id: NotificationID })[] => {
  const coalescedNotifications: (Notification & { id: NotificationID })[] = []
  const commentMapToTopNotification = new Map<CommentID, NotificationID>()
  const replyMapToTopNotification = new Map<ReplyID, NotificationID>()

  for (const notification of notifications) {
    if (notification.action === NotificationAction.ShowComment) {
      if (!commentMapToTopNotification.get(notification.payload.commentID)) {
        commentMapToTopNotification.set(notification.payload.commentID, notification.id)
      }
    } else if (notification.action === NotificationAction.ShowReply) {
      if (!replyMapToTopNotification.get(notification.payload.replyID)) {
        replyMapToTopNotification.set(notification.payload.replyID, notification.id)
      }
    }
  }

  for (const notification of notifications) {
    if (notification.action === NotificationAction.ShowComment) {
      const commentID = notification.payload.commentID
      if (commentMapToTopNotification.get(commentID) === notification.id) {
        coalescedNotifications.push(notification)
      }
    } else if (notification.action === NotificationAction.ShowReply) {
      const replyID = notification.payload.replyID
      if (replyMapToTopNotification.get(replyID) === notification.id) {
        coalescedNotifications.push(notification)
      }
    } else coalescedNotifications.push(notification)
  }

  return coalescedNotifications
}

// Exports:
export default coalesceNotifications
