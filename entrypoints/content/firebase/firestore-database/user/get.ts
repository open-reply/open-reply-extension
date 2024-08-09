// Packages:
import { firestore } from '../..'
import { doc, getDoc } from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot } from 'firebase/firestore'
import type { FirestoreDatabaseUser } from 'types/firestore.database'

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

// getUserFlatComments
// getUserFlatReplies
// getNotifications
// getReports
// getFollowers
// getFollowing
