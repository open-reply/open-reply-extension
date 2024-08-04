// Packages:
import { firestore } from '../..'
import { doc, getDoc } from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot } from 'firebase/firestore'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { URLHash } from 'types/websites'
import type { CommentID, ReplyID } from 'types/comments-and-replies'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
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
