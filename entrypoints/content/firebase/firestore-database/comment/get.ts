// Packages:
import { firestore } from '../..'
import {
  collection,
  query,
  orderBy as _orderBy,
  limit as _limit,
  startAfter,
  getDocs,
} from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import type { URLHash } from 'types/websites'
import { OrderBy } from 'types/votes'
import type { Comment } from 'types/comments-and-replies'

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
        commentsQuery = query(commentsQuery, _orderBy('voteCount.summation', 'desc'))
        break
      case OrderBy.Popular:
        commentsQuery = query(commentsQuery, _orderBy('voteCount.score', 'desc'))
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
