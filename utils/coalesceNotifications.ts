// Typescript:
import type { CommentID, ReplyID } from 'types/comments-and-replies'
import {
  NotificationAction,
  type Notification,
  type NotificationID,
} from 'types/notifications'

// Functions:
const coalesceNotifications = <T extends Notification>(notifications: (T & { id: NotificationID })[]): (T & { id: NotificationID, count: number })[] => {
  const coalescedNotifications: (Notification & { id: NotificationID, count: number })[] = []

  const commentMapToTopNotification = new Map<CommentID, NotificationID>()
  const commentCoalescedCount = new Map<CommentID, number>()
  
  const replyMapToTopNotification = new Map<CommentID | ReplyID, NotificationID>()
  const replyCoalescedCount = new Map<CommentID | ReplyID, number>()

  for (const notification of notifications) {
    if (notification.action === NotificationAction.ShowComment) {
      if (!commentMapToTopNotification.get(notification.payload.commentID)) {
        commentMapToTopNotification.set(notification.payload.commentID, notification.id)
        commentCoalescedCount.set(notification.payload.commentID, 1)
      } else commentCoalescedCount.set(notification.payload.commentID, (commentCoalescedCount.get(notification.payload.commentID) ?? 0) + 1)
    } else if (notification.action === NotificationAction.ShowReply) {
      const replyReferenceID = notification.payload.isReplyToReply ? notification.payload.originalReplyID : notification.payload.commentID

      if (!replyMapToTopNotification.get(replyReferenceID)) {
        replyMapToTopNotification.set(replyReferenceID, notification.id)
        replyCoalescedCount.set(replyReferenceID, 1)
      } else replyCoalescedCount.set(replyReferenceID, (replyCoalescedCount.get(replyReferenceID) ?? 0) + 1)
    }
  }

  for (const notification of notifications) {
    if (notification.action === NotificationAction.ShowComment) {
      const commentID = notification.payload.commentID
      if (commentMapToTopNotification.get(commentID) === notification.id) {
        coalescedNotifications.push({ ...notification, count: commentCoalescedCount.get(commentID) ?? 1 })
      }
    } else if (notification.action === NotificationAction.ShowReply) {
      const replyReferenceID = notification.payload.isReplyToReply ? notification.payload.originalReplyID : notification.payload.commentID

      if (replyMapToTopNotification.get(replyReferenceID) === notification.id) {
        coalescedNotifications.push({ ...notification, count: replyCoalescedCount.get(replyReferenceID) ?? 1 })
      }
    } else coalescedNotifications.push({ ...notification, count: 1 })
  }

  return coalescedNotifications as (T & { id: NotificationID, count: number })[]
}

// Exports:
export default coalesceNotifications
