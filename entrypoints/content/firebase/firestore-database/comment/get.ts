// Packages:
import { firestore } from '../..'
import {
  collection,
  query,
  orderBy as _orderBy,
  limit as _limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { URLHash } from 'types/websites'
import { OrderBy } from 'types/votes'
import type { Comment, CommentID } from 'types/comments-and-replies'
import type { UID } from 'types/user'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

/**
 * Fetches the comments for a website.
 */
export const getComments = async ({
  URLHash,
  limit = 10,
  orderBy = OrderBy.Popular,
  lastVisible = null,
}: {
  URLHash: URLHash
  limit?: number
  orderBy: OrderBy
  lastVisible: QueryDocumentSnapshot<Comment> | null
}): Promise<Returnable<{
  comments: Comment[],
  lastVisible: QueryDocumentSnapshot<Comment> | null
}, Error>> => {
  try {
    const commentsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX, URLHash, FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX)
    let commentsQuery = query(commentsRef, _limit(limit))

    switch (orderBy) {
      case OrderBy.Oldest:
        commentsQuery = query(commentsQuery, _orderBy('createdAt', 'asc'))
        break
      case OrderBy.Newest:
        commentsQuery = query(commentsQuery, _orderBy('createdAt', 'desc'))
        break
      case OrderBy.Controversial:
        commentsQuery = query(commentsQuery, _orderBy('voteCount.controversy', 'desc'))
        break
      case OrderBy.Popular:
        commentsQuery = query(commentsQuery, _orderBy('voteCount.wilsonScore', 'desc'))
        break
    }

    if (lastVisible) commentsQuery = query(commentsQuery, startAfter(lastVisible))

    const commentsSnapshot = await getDocs(commentsQuery)
    const comments: Comment[] = commentsSnapshot.docs.map(commentSnapshot => commentSnapshot.data() as Comment)

    const newLastVisible = (commentsSnapshot.docs[commentsSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<Comment> | null
    
    return returnable.success({
      comments,
      lastVisible: newLastVisible
    })
  } catch (error) {
    logError({
      functionName: 'getComments',
      data: {
        URLHash,
        limit,
        orderBy,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the comments posted by a user.
 */
export const getUserComments = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<Comment> | null
}): Promise<Returnable<{
  comments: Comment[],
  lastVisible: QueryDocumentSnapshot<Comment> | null
}, Error>> => {
  try {
    const commentsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.COMMENTS.INDEX)
    let commentsQuery = query(commentsRef, _limit(limit))

    if (lastVisible) commentsQuery = query(commentsQuery, startAfter(lastVisible))

    const commentsSnapshot = await getDocs(commentsQuery)
    const comments: Comment[] = commentsSnapshot.docs.map(commentSnapshot => commentSnapshot.data() as Comment)

    const newLastVisible = (commentsSnapshot.docs[commentsSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<Comment> | null
    
    return returnable.success({
      comments,
      lastVisible: newLastVisible
    })
  } catch (error) {
    logError({
      functionName: 'getUserComments',
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
 * Fetches the comment snapshot given the commentID and the URLHash from the Firestore Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getCommentSnapshot = async ({
  commentID,
  URLHash,
}: {
  commentID: CommentID
  URLHash: URLHash
}) => {
  try {
    return returnable.success(
      await getDoc(
        doc(
          firestore,
          FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX,
          URLHash,
          FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX,
          commentID
        )
      ) as DocumentSnapshot<Comment>
    )
  } catch (error) {
    logError({
      functionName: 'getCommentSnapshot',
      data: {
        commentID,
        URLHash,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
