// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { FirestoreDatabaseUser } from 'types/firestore.database'
import type {
  FlatComment,
  FlatReply,
  FlatReport,
  FollowerUser,
  FollowingUser,
  UID,
} from 'types/user'
import type {
  WebsiteBookmark,
  CommentBookmark,
  ReplyBookmark,
} from 'types/bookmarks'
import type { _Notification, Notification, NotificationID } from 'types/notifications'
import  { NotificationSubtype, SubscriptionType } from 'types/internal-messaging'
import type { CommentID, ReplyID, ReportID } from 'types/comments-and-replies'
import type { URLHash } from 'types/websites'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches the user given a UID from the Firestore Database.
 */
export const getFirestoreUser = async (UID: UID): Promise<Returnable<FirestoreDatabaseUser | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<FirestoreDatabaseUser | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFirestoreUser,
          payload: UID,
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getFirestoreUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's flat comments.
 */
export const getUserFlatComments = async ({
  UID,
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  UID: UID
  limit?: number
  lastVisible: CommentID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  flatComments: FlatComment[],
  lastVisible: CommentID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      flatComments: FlatComment[],
      lastVisible: CommentID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getUserFlatComments,
          payload: {
            UID,
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getUserFlatComments',
      data: {
        UID,
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's flat replies.
 */
export const getUserFlatReplies = async ({
  UID,
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  UID: UID
  limit?: number
  lastVisible: ReplyID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  flatReplies: FlatReply[],
  lastVisible: ReplyID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      flatReplies: FlatReply[],
      lastVisible: ReplyID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getUserFlatReplies,
          payload: {
            UID,
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getUserFlatReplies',
      data: {
        UID,
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the current user's notifications.
 */
export const getNotifications = async ({
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  limit?: number
  lastVisible: NotificationID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  notifications: (Notification & { id: NotificationID })[],
  lastVisible: NotificationID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      notifications: (Notification & { id: NotificationID })[],
      lastVisible: NotificationID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getNotifications,
          payload: {
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getNotifications',
      data: {
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the current user's flat reports.
 */
export const getFlatReports = async ({
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  limit?: number
  lastVisible: ReportID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  flatReports: FlatReport[],
  lastVisible: ReportID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      flatReports: FlatReport[],
      lastVisible: ReportID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFlatReports,
          payload: {
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getFlatReports',
      data: {
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch any user's followers.
 */
export const getFollowers = async ({
  UID,
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  UID: UID
  limit?: number
  lastVisible: UID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  followers: FollowerUser[],
  lastVisible: UID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      followers: FollowerUser[],
      lastVisible: UID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFollowers,
          payload: {
            UID,
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getFollowers',
      data: {
        UID,
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's followers.
 */
export const getUserFollowers = async ({
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  limit?: number
  lastVisible: UID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  followers: FollowerUser[],
  lastVisible: UID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      followers: FollowerUser[],
      lastVisible: UID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getUserFollowers,
          payload: {
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getUserFollowers',
      data: {
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch any user's following.
 */
export const getFollowing = async ({
  UID,
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  UID: UID
  limit?: number
  lastVisible: UID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  following: FollowingUser[],
  lastVisible: UID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      following: FollowingUser[],
      lastVisible: UID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFollowing,
          payload: {
            UID,
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getFollowing',
      data: {
        UID,
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's following.
 */
export const getUserFollowing = async ({
  UID,
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  UID: UID
  limit?: number
  lastVisible: UID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  following: FollowingUser[],
  lastVisible: UID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      following: FollowingUser[],
      lastVisible: UID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getUserFollowing,
          payload: {
            UID,
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getUserFollowing',
      data: {
        UID,
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Checks if a user is following the signed-in user.
 */
export const isFollowingSignedInUser = async (UID: UID): Promise<Returnable<boolean, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<boolean, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.isFollowingSignedInUser,
          payload: UID,
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'isFollowingSignedInUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Checks if the signed-in user is following a user.
 */
export const isSignedInUserFollowing = async (UID: UID): Promise<Returnable<boolean, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<boolean, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.isSignedInUserFollowing,
          payload: UID,
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'isSignedInUserFollowing',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the current user's website bookmarks.
 */
export const getWebsiteBookmarks = async ({
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  limit?: number
  lastVisible: URLHash | null
  resetPointer?: boolean
}): Promise<Returnable<{
  bookmarks: (WebsiteBookmark & { URLHash: URLHash })[],
  lastVisible: URLHash | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      bookmarks: (WebsiteBookmark & { URLHash: URLHash })[],
      lastVisible: URLHash | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getWebsiteBookmarks,
          payload: {
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getWebsiteBookmarks',
      data: {
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the current user's comment bookmarks.
 */
export const getCommentBookmarks = async ({
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  limit?: number
  lastVisible: CommentID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  bookmarks: (CommentBookmark & { id: CommentID })[],
  lastVisible: CommentID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      bookmarks: (CommentBookmark & { id: CommentID })[],
      lastVisible: CommentID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getCommentBookmarks,
          payload: {
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getCommentBookmarks',
      data: {
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's reply bookmarks.
 */
export const getReplyBookmarks = async ({
  limit = 10,
  lastVisible = null,
  resetPointer,
}: {
  limit?: number
  lastVisible: ReplyID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  bookmarks: (ReplyBookmark & { id: ReplyID })[],
  lastVisible: ReplyID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      bookmarks: (ReplyBookmark & { id: ReplyID })[],
      lastVisible: ReplyID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getReplyBookmarks,
          payload: {
            limit,
            lastVisible,
            resetPointer,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getReplyBookmarks',
      data: {
        limit,
        lastVisible,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Listen for notifications and caches them internally.
 */
export const listenForNotifications = async (
  onNewNotificationUnreadCount: (unreadCount: number) => Promise<void>,
  onAllNotificationsHaveBeenRead: () => void,
  limit?: number
): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.listenForNotifications,
          payload: {
            limit,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) {
      chrome.runtime.onMessage.addListener(request => {
        if (
          request.type === INTERNAL_MESSAGE_ACTIONS.GENERAL.ON_EVENT &&
          request.subscriptionType === SubscriptionType.Notifications &&
          request.payload.subtype === NotificationSubtype.NEW_NOTIFICATION_COUNT
        ) onNewNotificationUnreadCount(request.payload.payload)
        
        else if (
          request.type === INTERNAL_MESSAGE_ACTIONS.GENERAL.ON_EVENT &&
          request.subscriptionType === SubscriptionType.Notifications &&
          request.payload.subtype === NotificationSubtype.ALL_NOTIFICATIONS_HAVE_BEEN_READ
        ) onAllNotificationsHaveBeenRead()
      })

      return returnable.success(payload)
    }
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'listenForNotifications',
      data: {
        onNewNotificationUnreadCount,
        onAllNotificationsHaveBeenRead,
        limit,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Unsubscribes to notifications.
 */
export const unsubscribeToNotifications = async (): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.unsubscribeToNotifications,
          payload: null,
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'unsubscribeToNotifications',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
