// Packages:
import { firestore } from '../..'
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
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { FirestoreDatabaseUser } from 'types/firestore.database'
import type { FlatComment, FlatReply } from 'types/user'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the user snapshot given a UID from the Firestore Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getFirestoreUserSnapshot = async (UID: string): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseUser>, Error>> => {
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

export const getUserFlatComments = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: string
  limit?: number
  lastVisible: QueryDocumentSnapshot<FlatComment> | null
}): Promise<Returnable<{
  flatComments: FlatComment[],
  lastVisible: QueryDocumentSnapshot<FlatComment> | null
}, Error>> => {
  try {
    const flatCommentsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.COMMENTS.INDEX)
    let flatCommentsQuery = query(flatCommentsRef, _limit(limit), _orderBy('createdAt', 'asc'))

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

export const getUserFlatReplies = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: string
  limit?: number
  lastVisible: QueryDocumentSnapshot<FlatReply> | null
}): Promise<Returnable<{
  flatReplies: FlatReply[],
  lastVisible: QueryDocumentSnapshot<FlatReply> | null
}, Error>> => {
  try {
    const flatRepliesRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.REPLIES.INDEX)
    let flatRepliesQuery = query(flatRepliesRef, _limit(limit), _orderBy('createdAt', 'asc'))

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

// getNotifications
// getReports
// getFollowers
// getFollowing
