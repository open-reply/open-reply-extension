// Packages:
import { firestore } from '../..'
import {
  collection,
  doc,
  getDoc,
  query,
  limit as _limit,
  startAfter,
  getDocs,
} from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { URLHash } from 'types/websites'
import type { CommentID, Reply, ReplyID } from 'types/comments-and-replies'
import type { UID } from 'types/user'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the replies for a comment on a website.
 */
export const getReplies = async ({
  URLHash,
  commentID,
  limit = 10,
  lastVisible = null,
}: {
  URLHash: URLHash
  commentID: CommentID
  limit?: number
  lastVisible: QueryDocumentSnapshot<Reply> | null
}): Promise<Returnable<{
  replies: Reply[],
  lastVisible: QueryDocumentSnapshot<Reply> | null
}, Error>> => {
  try {
    const repliesRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX,
      URLHash,
      FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX,
      commentID,
      FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX,
    )
    let repliesQuery = query(repliesRef, _limit(limit))

    if (lastVisible) repliesQuery = query(repliesQuery, startAfter(lastVisible))

    const repliesSnapshot = await getDocs(repliesQuery)
    const replies: Reply[] = repliesSnapshot.docs.map(replySnapshot => replySnapshot.data() as Reply)

    const newLastVisible = (repliesSnapshot.docs[repliesSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<Reply> | null
    
    return returnable.success({
      replies,
      lastVisible: newLastVisible
    })
  } catch (error) {
    logError({
      functionName: 'getComments',
      data: {
        URLHash,
        limit,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the replies posted by a user.
 */
export const getUserReplies = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<Reply> | null
}): Promise<Returnable<{
  replies: Reply[],
  lastVisible: QueryDocumentSnapshot<Reply> | null
}, Error>> => {
  try {
    const repliesRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.USERS.INDEX,
      UID,
      FIRESTORE_DATABASE_PATHS.USERS.REPLIES.INDEX,
    )
    let repliesQuery = query(repliesRef, _limit(limit))

    if (lastVisible) repliesQuery = query(repliesQuery, startAfter(lastVisible))

    const repliesSnapshot = await getDocs(repliesQuery)
    const replies: Reply[] = repliesSnapshot.docs.map(replySnapshot => replySnapshot.data() as Reply)

    const newLastVisible = (repliesSnapshot.docs[repliesSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<Reply> | null
    
    return returnable.success({
      replies,
      lastVisible: newLastVisible
    })
  } catch (error) {
    logError({
      functionName: 'getUserReplies',
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
 * Fetches the reply snapshot given a URLHash from the Firestore Database.
 * 
 * You can get the `URLHash` by using the `utils/getURLHash()` function.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getReplySnapshot = async ({
  replyID,
  commentID,
  URLHash,
}: {
  replyID: ReplyID
  commentID: CommentID
  URLHash: URLHash
}): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>> => {
  try {
    return returnable.success(
      await getDoc(
        doc(
          firestore,
          FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX,
          URLHash,
          FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX,
          commentID,
          FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX,
          replyID,
        )
      ) as DocumentSnapshot<FirestoreDatabaseWebsite>
    )
  } catch (error) {
    logError({
      functionName: 'getReplySnapshot',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
