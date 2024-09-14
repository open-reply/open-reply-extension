// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
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
import type { _Notification, Notification } from 'types/notifications'
import { SubscriptionType } from 'types/internal-messaging'

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
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFirestoreUser,
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
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<FlatComment> | null
}): Promise<Returnable<{
  flatComments: FlatComment[],
  lastVisible: QueryDocumentSnapshot<FlatComment> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      flatComments: FlatComment[],
      lastVisible: QueryDocumentSnapshot<FlatComment> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getUserFlatComments,
          payload: {
            UID,
            limit,
            lastVisible,
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
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<FlatReply> | null
}): Promise<Returnable<{
  flatReplies: FlatReply[],
  lastVisible: QueryDocumentSnapshot<FlatReply> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      flatReplies: FlatReply[],
      lastVisible: QueryDocumentSnapshot<FlatReply> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getUserFlatReplies,
          payload: {
            UID,
            limit,
            lastVisible,
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
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<Notification> | null
}): Promise<Returnable<{
  notifications: Notification[],
  lastVisible: QueryDocumentSnapshot<Notification> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      notifications: Notification[],
      lastVisible: QueryDocumentSnapshot<Notification> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getNotifications,
          payload: {
            limit,
            lastVisible,
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
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<FlatReport> | null
}): Promise<Returnable<{
  flatReports: FlatReport[],
  lastVisible: QueryDocumentSnapshot<FlatReport> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      flatReports: FlatReport[],
      lastVisible: QueryDocumentSnapshot<FlatReport> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFlatReports,
          payload: {
            limit,
            lastVisible,
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
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's followers.
 */
export const getFollowers = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<FollowerUser> | null
}): Promise<Returnable<{
  followers: FollowerUser[],
  lastVisible: QueryDocumentSnapshot<FollowerUser> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      followers: FollowerUser[],
      lastVisible: QueryDocumentSnapshot<FollowerUser> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFollowers,
          payload: {
            UID,
            limit,
            lastVisible,
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
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's following.
 */
export const getFollowing = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<FollowingUser> | null
}): Promise<Returnable<{
  following: FollowingUser[],
  lastVisible: QueryDocumentSnapshot<FollowingUser> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      following: FollowingUser[],
      lastVisible: QueryDocumentSnapshot<FollowingUser> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFollowing,
          payload: {
            UID,
            limit,
            lastVisible,
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
      },
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
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<WebsiteBookmark> | null
}): Promise<Returnable<{
  bookmarks: WebsiteBookmark[],
  lastVisible: QueryDocumentSnapshot<WebsiteBookmark> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      bookmarks: WebsiteBookmark[],
      lastVisible: QueryDocumentSnapshot<WebsiteBookmark> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getWebsiteBookmarks,
          payload: {
            limit,
            lastVisible,
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
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<CommentBookmark> | null
}): Promise<Returnable<{
  bookmarks: CommentBookmark[],
  lastVisible: QueryDocumentSnapshot<CommentBookmark> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      bookmarks: CommentBookmark[],
      lastVisible: QueryDocumentSnapshot<CommentBookmark> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getCommentBookmarks,
          payload: {
            limit,
            lastVisible,
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
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<ReplyBookmark> | null
}): Promise<Returnable<{
  bookmarks: ReplyBookmark[],
  lastVisible: QueryDocumentSnapshot<ReplyBookmark> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      bookmarks: ReplyBookmark[],
      lastVisible: QueryDocumentSnapshot<ReplyBookmark> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getReplyBookmarks,
          payload: {
            limit,
            lastVisible,
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
  onNotification: (notifications: Notification[]) => Promise<void>
): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.listenForNotifications,
          payload: null,
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
          request.payload
        ) onNotification(request.payload)
      })

      return returnable.success(payload)
    }
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'listenForNotifications',
      data: {
        onNotification,
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
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.unsubscribeToNotifications,
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
