// Packages:
import { firestore } from '../..'
import { doc, getDoc } from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot } from 'firebase/firestore'
import type { FirestoreDatabaseUser, FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { URLHash } from 'types/websites'
import type { CommentID, ReplyID } from 'types/comments-and-replies'

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

/**
 * Fetches the website snapshot given a URLHash from the Firestore Database.
 * 
 * You can get the `URLHash` by using the `utils/getURLHash()` function.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getFirestoreWebsiteSnapshot = async (URLHash: URLHash): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>> => {
  try {
    return returnable.success(await getDoc(doc(firestore, FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX, URLHash)) as DocumentSnapshot<FirestoreDatabaseWebsite>)
  } catch (error) {
    logError({
      functionName: 'getFirestoreWebsiteSnapshot',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the comment snapshot given a commentID and a URLHash from the Firestore Database.
 * 
 * You can get the `URLHash` by using the `utils/getURLHash()` function.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getFirestoreCommentSnapshot = async (commentID: CommentID, URLHash: URLHash): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>> => {
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
      ) as DocumentSnapshot<FirestoreDatabaseWebsite>
    )
  } catch (error) {
    logError({
      functionName: 'getFirestoreWebsiteSnapshot',
      data: URLHash,
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
export const getFirestoreReplySnapshot = async (replyID: ReplyID, commentID: CommentID, URLHash: URLHash): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>> => {
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
      functionName: 'getFirestoreWebsiteSnapshot',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
