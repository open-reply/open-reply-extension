// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot } from 'firebase/firestore'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { URLHash } from 'types/websites'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches the website snapshot given the URLHash from the Firestore Database.
 * 
 * Note that this does not return the vote of the current user. Call `_getWebsiteVote` separately for that.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getFirestoreWebsiteSnapshot = async (URLHash: URLHash): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.get.getFirestoreWebsiteSnapshot,
          payload: URLHash,
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getFirestoreWebsiteSnapshot',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
