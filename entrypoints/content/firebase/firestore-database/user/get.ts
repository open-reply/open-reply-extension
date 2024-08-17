// Packages:
import { auth, firestore } from '../..'
import {
  collection,
  doc,
  getDoc,
  query,
  limit as _limit,
  orderBy as _orderBy,
  startAfter,
  getDocs,
  onSnapshot,
} from 'firebase/firestore'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot, QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore'
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
import type { Notification } from 'types/notifications'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the user snapshot given a UID from the Firestore Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getFirestoreUserSnapshot = async (UID: UID): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseUser>, Error>> => {
  try {
    return returnable.success(await getDoc(doc(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID)) as DocumentSnapshot<FirestoreDatabaseUser>)
  } catch (error) {
    logError({
      functionName: 'getFirestoreUserSnapshot',
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
    const flatCommentsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.COMMENTS.INDEX)
    let flatCommentsQuery = query(flatCommentsRef, _limit(limit), _orderBy('createdAt', 'desc'))

    if (lastVisible) flatCommentsQuery = query(flatCommentsQuery, startAfter(lastVisible))

    const flatCommentsSnapshot = await getDocs(flatCommentsQuery)
    const flatComments: FlatComment[] = flatCommentsSnapshot.docs.map(flatCommentSnapshot => flatCommentSnapshot.data() as FlatComment)

    const newLastVisible = (flatCommentsSnapshot.docs[flatCommentsSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<FlatComment> | null

    return returnable.success({
      flatComments,
      lastVisible: newLastVisible
    })
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
    const flatRepliesRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.REPLIES.INDEX)
    let flatRepliesQuery = query(flatRepliesRef, _limit(limit), _orderBy('createdAt', 'desc'))

    if (lastVisible) flatRepliesQuery = query(flatRepliesQuery, startAfter(lastVisible))

    const flatRepliesSnapshot = await getDocs(flatRepliesQuery)
    const flatReplies: FlatReply[] = flatRepliesSnapshot.docs.map(flatReplySnapshot => flatReplySnapshot.data() as FlatReply)

    const newLastVisible = (flatRepliesSnapshot.docs[flatRepliesSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<FlatReply> | null

    return returnable.success({
      flatReplies,
      lastVisible: newLastVisible
    })
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
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const notificationsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, auth.currentUser.uid, FIRESTORE_DATABASE_PATHS.USERS.NOTIFICATIONS.INDEX)
    let notificationsQuery = query(notificationsRef, _limit(limit), _orderBy('createdAt', 'desc'))

    if (lastVisible) notificationsQuery = query(notificationsQuery, startAfter(lastVisible))

    const notificationsSnapshot = await getDocs(notificationsQuery)
    const notifications: Notification[] = notificationsSnapshot.docs.map(notificationSnapshot => notificationSnapshot.data() as Notification)

    const newLastVisible = (notificationsSnapshot.docs[notificationsSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<Notification> | null

    return returnable.success({
      notifications,
      lastVisible: newLastVisible
    })
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
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const flatReportsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.REPORTS.INDEX, auth.currentUser.uid, FIRESTORE_DATABASE_PATHS.USERS.REPORTS.INDEX)
    let flatReportsQuery = query(flatReportsRef, _limit(limit), _orderBy('reportedAt', 'desc'))

    if (lastVisible) flatReportsQuery = query(flatReportsQuery, startAfter(lastVisible))

    const flatReportsSnapshot = await getDocs(flatReportsQuery)
    const flatReports: FlatReport[] = flatReportsSnapshot.docs.map(flatReportSnapshot => flatReportSnapshot.data() as FlatReport)

    const newLastVisible = (flatReportsSnapshot.docs[flatReportsSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<FlatReport> | null

    return returnable.success({
      flatReports,
      lastVisible: newLastVisible
    })
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
    const followersRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX)
    let followersQuery = query(followersRef, _limit(limit), _orderBy('followedAt', 'desc'))

    if (lastVisible) followersQuery = query(followersQuery, startAfter(lastVisible))

    const followersSnapshot = await getDocs(followersQuery)
    const followers: FollowerUser[] = followersSnapshot.docs.map(followerSnapshot => followerSnapshot.data() as FollowerUser)

    const newLastVisible = (followersSnapshot.docs[followersSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<FollowerUser> | null

    return returnable.success({
      followers,
      lastVisible: newLastVisible
    })
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
    const followingRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.FOLLOWING.INDEX)
    let followingQuery = query(followingRef, _limit(limit), _orderBy('followedAt', 'desc'))

    if (lastVisible) followingQuery = query(followingQuery, startAfter(lastVisible))

    const followingSnapshot = await getDocs(followingQuery)
    const following: FollowerUser[] = followingSnapshot.docs.map(_followingSnapshot => _followingSnapshot.data() as FollowingUser)

    const newLastVisible = (followingSnapshot.docs[followingSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<FollowingUser> | null

    return returnable.success({
      following,
      lastVisible: newLastVisible
    })
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
    const bookmarks: WebsiteBookmark[] = bookmarksSnapshot.docs.map(bookmarkSnapshot => bookmarkSnapshot.data() as WebsiteBookmark)

    const newLastVisible = (bookmarksSnapshot.docs[bookmarksSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<WebsiteBookmark> | null

    return returnable.success({
      bookmarks,
      lastVisible: newLastVisible
    })
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
    const bookmarks: CommentBookmark[] = bookmarksSnapshot.docs.map(bookmarkSnapshot => bookmarkSnapshot.data() as CommentBookmark)

    const newLastVisible = (bookmarksSnapshot.docs[bookmarksSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<CommentBookmark> | null

    return returnable.success({
      bookmarks,
      lastVisible: newLastVisible
    })
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
    const bookmarks: ReplyBookmark[] = bookmarksSnapshot.docs.map(bookmarkSnapshot => bookmarkSnapshot.data() as ReplyBookmark)

    const newLastVisible = (bookmarksSnapshot.docs[bookmarksSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<ReplyBookmark> | null

    return returnable.success({
      bookmarks,
      lastVisible: newLastVisible
    })
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
 * Listen for notifications.
 */
export const listenForNotifications = async (
  onNotification: (notifications: Notification[]) => Promise<void>
): Promise<Returnable<Unsubscribe, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const notificationsRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.USERS.INDEX,
      auth.currentUser.uid,
      FIRESTORE_DATABASE_PATHS.USERS.NOTIFICATIONS.INDEX
    )
    const q = query(notificationsRef, _orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, snapshot => {
      const notifications = snapshot.docs
        .map(notificationSnapshot => notificationSnapshot.data()) as Notification[]

      onNotification(notifications)
    })

    return returnable.success(unsubscribe)
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
