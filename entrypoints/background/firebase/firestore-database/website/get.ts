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

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the website snapshot given the URLHash from the Firestore Database.
 * 
 * Note that this does not return the vote of the current user. Call `_getWebsiteVote` separately for that.
 */
export const _getFirestoreWebsite = async (URLHash: URLHash): Promise<Returnable<FirestoreDatabaseWebsite | undefined, Error>> => {
  try {
    return returnable.success(
      (
        await getDoc(doc(firestore, FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX, URLHash)) as DocumentSnapshot<FirestoreDatabaseWebsite>
      ).data()
    )
  } catch (error) {
    logError({
      functionName: '_getFirestoreWebsite',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
