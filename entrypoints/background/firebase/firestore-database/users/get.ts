// Packages:
import { auth, database, firestore } from '../..'
import {
  collection,
  doc,
  getDoc,
  query,
  limit as _limit,
  orderBy as _orderBy,
  startAfter,
  getDocs,
} from 'firebase/firestore'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { _setLastReadNotificationID } from '../../realtime-database/notifications/set'
import {
  addCachedFollowers,
  addCachedFollowings,
  getCachedFollowersList,
  getCachedFollowingList,
} from '@/entrypoints/background/localforage/follow'
import { onValue, ref } from 'firebase/database'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore'
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
import { type LastVisibleInstance, NotificationSubtype, SubscriptionType } from 'types/internal-messaging'
import type { URLHash } from 'types/websites'
import type { CommentID, ReplyID } from 'types/comments-and-replies'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the user snapshot given a UID from the Firestore Database.
 */
export const _getFirestoreUser = async (UID: UID): Promise<Returnable<FirestoreDatabaseUser | undefined, Error>> => {
  try {
    return returnable.success(
      (
        await getDoc(doc(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID)) as DocumentSnapshot<FirestoreDatabaseUser>
      ).data()
    )
  } catch (error) {
    logError({
      functionName: '_getFirestoreUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the user's flat comments.
 */
export const _getUserFlatComments = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  flatComments: FlatComment[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const flatCommentsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.COMMENTS.INDEX)
    let flatCommentsQuery = query(flatCommentsRef, _limit(limit), _orderBy('createdAt', 'desc'))

    if (lastVisible) flatCommentsQuery = query(flatCommentsQuery, startAfter(lastVisible))

    const flatCommentsSnapshot = await getDocs(flatCommentsQuery)
    const flatComments: FlatComment[] = flatCommentsSnapshot.docs.map(flatCommentSnapshot => flatCommentSnapshot.data() as FlatComment)

    const newLastVisibleInstance = {
      snapshot: flatComments.length < limit ? null : (flatCommentsSnapshot.docs[flatCommentsSnapshot.docs.length - 1] ?? null),
      id: flatComments.length < limit ? null : flatComments[flatComments.length - 1] ? flatComments[flatComments.length - 1].id : null,
      reachedEnd: flatComments.length < limit,
    }

    return returnable.success({
      flatComments,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getUserFlatComments',
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
export const _getUserFlatReplies = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  flatReplies: FlatReply[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const flatRepliesRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.REPLIES.INDEX)
    let flatRepliesQuery = query(flatRepliesRef, _limit(limit), _orderBy('createdAt', 'desc'))

    if (lastVisible) flatRepliesQuery = query(flatRepliesQuery, startAfter(lastVisible))

    const flatRepliesSnapshot = await getDocs(flatRepliesQuery)
    const flatReplies: FlatReply[] = flatRepliesSnapshot.docs.map(flatReplySnapshot => flatReplySnapshot.data() as FlatReply)

    const newLastVisibleInstance = {
      snapshot: flatReplies.length < limit ? null : (flatRepliesSnapshot.docs[flatRepliesSnapshot.docs.length - 1] ?? null),
      id: flatReplies.length < limit ? null : flatReplies[flatReplies.length - 1] ? flatReplies[flatReplies.length - 1].id : null,
      reachedEnd: flatReplies.length < limit,
    }

    return returnable.success({
      flatReplies,
      lastVisibleInstance: newLastVisibleInstance
    })
  } catch (error) {
    logError({
      functionName: '_getUserFlatReplies',
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
export const _getNotifications = async ({
  limit = 10,
  lastVisible = null,
  broadcast,
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
  broadcast: <T>(event: {
    type: SubscriptionType
    payload: T
  }) => void,
}): Promise<Returnable<{
  notifications: (Notification & { id: NotificationID })[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const notificationsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, auth.currentUser.uid, FIRESTORE_DATABASE_PATHS.USERS.NOTIFICATIONS.INDEX)
    let notificationsQuery = query(notificationsRef, _limit(limit), _orderBy('createdAt', 'desc'))

    if (lastVisible) notificationsQuery = query(notificationsQuery, startAfter(lastVisible))

    const notificationsSnapshot = await getDocs(notificationsQuery)
    const notifications = notificationsSnapshot.docs.map(notificationSnapshot => ({
      id: notificationSnapshot.id,
      ...notificationSnapshot.data(),
    })) as (Notification & { id: NotificationID })[]

    const latestVisibleNotificationID = notifications.length > 0 ? notifications[0].id : null
    if (latestVisibleNotificationID !== null) await _setLastReadNotificationID(latestVisibleNotificationID)

    const newLastVisibleInstance = {
      snapshot: notifications.length < limit ? null : (notificationsSnapshot.docs[notificationsSnapshot.docs.length - 1] ?? null),
      id: notifications.length < limit ? null : notifications[notifications.length - 1] ? notifications[notifications.length - 1].id : null,
      reachedEnd: notifications.length < limit,
    }

    if (!lastVisible) {
      broadcast({
        type: SubscriptionType.Notifications,
        payload: {
          subtype: NotificationSubtype.ALL_NOTIFICATIONS_HAVE_BEEN_READ,
        },
      })
    }

    return returnable.success({
      notifications,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getNotifications',
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
export const _getFlatReports = async ({
  limit = 10,
  lastVisible = null,
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  flatReports: FlatReport[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const flatReportsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.REPORTS.INDEX, auth.currentUser.uid, FIRESTORE_DATABASE_PATHS.USERS.REPORTS.INDEX)
    let flatReportsQuery = query(flatReportsRef, _limit(limit), _orderBy('reportedAt', 'desc'))

    if (lastVisible) flatReportsQuery = query(flatReportsQuery, startAfter(lastVisible))

    const flatReportsSnapshot = await getDocs(flatReportsQuery)
    const flatReports: FlatReport[] = flatReportsSnapshot.docs.map(flatReportSnapshot => flatReportSnapshot.data() as FlatReport)

    const newLastVisibleInstance = {
      snapshot: flatReports.length < limit ? null : (flatReportsSnapshot.docs[flatReportsSnapshot.docs.length - 1] ?? null),
      id: flatReports.length < limit ? null : flatReports[flatReports.length - 1] ? flatReports[flatReports.length - 1].id : null,
      reachedEnd: flatReports.length < limit,
    }

    return returnable.success({
      flatReports,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getFlatReports',
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
 * Fetch any user's followers.
 */
export const _getFollowers = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  followers: FollowerUser[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const followersRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX)
    let followersQuery = query(followersRef, _limit(limit), _orderBy('followedAt', 'desc'))

    if (lastVisible) followersQuery = query(followersQuery, startAfter(lastVisible))

    const followersSnapshot = await getDocs(followersQuery)
    const followers: FollowerUser[] = followersSnapshot.docs.map(followerSnapshot => followerSnapshot.data() as FollowerUser)

    const newLastVisibleInstance = {
      snapshot: followers.length < limit ? null : (followersSnapshot.docs[followersSnapshot.docs.length - 1] ?? null),
      id: followers.length < limit ? null : followers[followers.length - 1] ? followers[followers.length - 1].UID : null,
      reachedEnd: followers.length < limit,
    }

    return returnable.success({
      followers,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getFollowers',
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
 * Fetch the user's followers.
 */
export const _getUserFollowers = async ({
  limit = 10,
  lastVisible = null,
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  followers: FollowerUser[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const {
      status,
      payload,
    } = await _getFollowers({
      UID: auth.currentUser.uid,
      lastVisible,
      limit,
    })
    if (!status) throw payload

    const followers = payload.followers
    await addCachedFollowers(
      followers.map(follower => ({ UID: follower.UID, user: follower }))
    )

    return returnable.success(payload)
  } catch (error) {
    logError({
      functionName: '_getUserFollowers',
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
 * Fetch any user's following.
 */
export const _getFollowing = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  following: FollowingUser[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const followingRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.FOLLOWING.INDEX)
    let followingQuery = query(followingRef, _limit(limit), _orderBy('followedAt', 'desc'))

    if (lastVisible) followingQuery = query(followingQuery, startAfter(lastVisible))

    const followingSnapshot = await getDocs(followingQuery)
    const following: FollowerUser[] = followingSnapshot.docs.map(_followingSnapshot => _followingSnapshot.data() as FollowingUser)

    const newLastVisibleInstance = {
      snapshot: following.length < limit ? null : (followingSnapshot.docs[followingSnapshot.docs.length - 1] ?? null),
      id: following.length < limit ? null : following[following.length - 1] ? following[following.length - 1].UID : null,
      reachedEnd: following.length < limit,
    }

    return returnable.success({
      following,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getFollowing',
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
export const _getUserFollowing = async ({
  limit = 10,
  lastVisible = null,
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  following: FollowingUser[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const {
      status,
      payload,
    } = await _getFollowing({
      UID: auth.currentUser.uid,
      lastVisible,
      limit,
    })
    if (!status) throw payload

    const following = payload.following
    await addCachedFollowings(
      following.map(
        followingUser => ({ UID: followingUser.UID, user: followingUser })
      )
    )

    return returnable.success(payload)
  } catch (error) {
    logError({
      functionName: '_getUserFollowing',
      data: {
        limit,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

// TODO: Add fetchMode, currently they're just relying on cache.
/**
 * Checks if a user is following the signed-in user.
 */
export const _isFollowingSignedInUser = async (UID: UID): Promise<Returnable<boolean, Error>> => {
  try {
    const followers = await getCachedFollowersList()
    return returnable.success(followers.includes(UID))
  } catch (error) {
    logError({
      functionName: '_isFollowingSignedInUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

// TODO: Add fetchMode, currently they're just relying on cache.
/**
 * Checks if the signed-in user is following a user.
 */
export const _isSignedInUserFollowing = async (UID: UID): Promise<Returnable<boolean, Error>> => {
  try {
    const following = await getCachedFollowingList()
    return returnable.success(following.includes(UID))
  } catch (error) {
    logError({
      functionName: '_isSignedInUserFollowing',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetch the current user's website bookmarks.
 */
export const _getWebsiteBookmarks = async ({
  limit = 10,
  lastVisible = null,
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  bookmarks: (WebsiteBookmark & { URLHash: URLHash })[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const bookmarksRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.USERS.INDEX,
      auth.currentUser.uid,
      FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_WEBSITES.INDEX,
    )
    let bookmarksQuery = query(bookmarksRef, _limit(limit), _orderBy('bookmarkedAt', 'desc'))

    if (lastVisible) bookmarksQuery = query(bookmarksQuery, startAfter(lastVisible))

    const bookmarksSnapshot = await getDocs(bookmarksQuery)
    const bookmarks = bookmarksSnapshot.docs.map(bookmarkSnapshot => ({
      URLHash: bookmarkSnapshot.id,
      ...bookmarkSnapshot.data(),
    })) as (WebsiteBookmark & { URLHash: URLHash })[]

    const newLastVisibleInstance = {
      snapshot: bookmarks.length < limit ? null : (bookmarksSnapshot.docs[bookmarksSnapshot.docs.length - 1] ?? null),
      id: bookmarks.length < limit ? null : bookmarks[bookmarks.length - 1] ? bookmarks[bookmarks.length - 1].URLHash : null,
      reachedEnd: bookmarks.length < limit,
    }

    return returnable.success({
      bookmarks,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getWebsiteBookmarks',
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
export const _getCommentBookmarks = async ({
  limit = 10,
  lastVisible = null,
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  bookmarks: (CommentBookmark & { id: CommentID })[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const bookmarksRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.USERS.INDEX,
      auth.currentUser.uid,
      FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_COMMENTS.INDEX,
    )
    let bookmarksQuery = query(bookmarksRef, _limit(limit), _orderBy('bookmarkedAt', 'desc'))

    if (lastVisible) bookmarksQuery = query(bookmarksQuery, startAfter(lastVisible))

    const bookmarksSnapshot = await getDocs(bookmarksQuery)
    const bookmarks = bookmarksSnapshot.docs.map(bookmarkSnapshot => ({
      id: bookmarkSnapshot.id,
      ...bookmarkSnapshot.data(),
    })) as (CommentBookmark & { id: CommentID })[]

    const newLastVisibleInstance = {
      snapshot: bookmarks.length < limit ? null : (bookmarksSnapshot.docs[bookmarksSnapshot.docs.length - 1] ?? null),
      id: bookmarks.length < limit ? null : bookmarks[bookmarks.length - 1] ? bookmarks[bookmarks.length - 1].URLHash : null,
      reachedEnd: bookmarks.length < limit,
    }

    return returnable.success({
      bookmarks,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getCommentBookmarks',
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
export const _getReplyBookmarks = async ({
  limit = 10,
  lastVisible = null,
}: {
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  bookmarks: (ReplyBookmark & { id: ReplyID })[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const bookmarksRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.USERS.INDEX,
      auth.currentUser.uid,
      FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_REPLIES.INDEX,
    )
    let bookmarksQuery = query(bookmarksRef, _limit(limit), _orderBy('bookmarkedAt', 'desc'))

    if (lastVisible) bookmarksQuery = query(bookmarksQuery, startAfter(lastVisible))

    const bookmarksSnapshot = await getDocs(bookmarksQuery)
    const bookmarks = bookmarksSnapshot.docs.map(bookmarkSnapshot => ({
      id: bookmarkSnapshot.id,
      ...bookmarkSnapshot.data(),
    })) as (ReplyBookmark & { id: ReplyID })[]

    const newLastVisibleInstance = {
      snapshot: bookmarks.length < limit ? null : (bookmarksSnapshot.docs[bookmarksSnapshot.docs.length - 1] ?? null),
      id: bookmarks.length < limit ? null : bookmarks[bookmarks.length - 1] ? bookmarks[bookmarks.length - 1].URLHash : null,
      reachedEnd: bookmarks.length < limit,
    }

    return returnable.success({
      bookmarks,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getReplyBookmarks',
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
export const _listenForNotifications = async (
  sender: chrome.runtime.MessageSender,
  broadcast: <T>(event: {
    type: SubscriptionType
    payload: T
  }) => void,
  limit = 10,
): Promise<Returnable<{
  subscriptionType: SubscriptionType
  tabID: number
  subscriberFunction: () => Unsubscribe
}, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const tabID = sender.tab?.id
    if (!tabID) return returnable.fail(new Error('Could not subscribe to notifications: Invalid Tab ID'))

    const notificationsUnreadCountRef = ref(database, REALTIME_DATABASE_PATHS.NOTIFICATIONS.unreadCount(auth.currentUser.uid))

    return returnable.success({
      subscriptionType: SubscriptionType.Notifications,
      tabID,
      subscriberFunction: () => {
        return onValue(notificationsUnreadCountRef, snapshot => {
          const unreadCount = snapshot.val() as number

          if (!isNaN(unreadCount)) {
            broadcast({
              type: SubscriptionType.Notifications,
              payload: {
                subtype: NotificationSubtype.NEW_NOTIFICATION_COUNT,
                payload: unreadCount,
              },
            })
          }
        })
      }
    })
  } catch (error) {
    logError({
      functionName: '_listenForNotifications',
      data: {
        sender,
        broadcast,
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
export const _unsubscribeToNotifications = async (
  sender: chrome.runtime.MessageSender,
  subscriptions: Partial<Record<SubscriptionType, {
    tabIDs: Set<number>
    unsubscribe: () => void
  }>>,
): Promise<Returnable<null, Error>> => {
  try {
    const tabID = sender.tab?.id
    if (!tabID) return returnable.fail(new Error('Could not unsubscribe to notifications: Invalid Tab ID'))
    
    if (subscriptions[SubscriptionType.Notifications]) {
      subscriptions[SubscriptionType.Notifications].tabIDs.delete(tabID)
      if (subscriptions[SubscriptionType.Notifications].tabIDs.size === 0) {
        subscriptions[SubscriptionType.Notifications].unsubscribe()
        delete subscriptions[SubscriptionType.Notifications]
      }
    }

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_unsubscribeToNotifications',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
