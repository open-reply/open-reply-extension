// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { URLHash } from 'types/websites'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches the website given the URLHash from the Firestore Database.
 * 
 * Note that this does not return the vote of the current user. Call `_getWebsiteVote` separately for that.
 */
export const getFirestoreWebsite = async (URLHash: URLHash): Promise<Returnable<FirestoreDatabaseWebsite | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<FirestoreDatabaseWebsite | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.get.getFirestoreWebsite,
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
      functionName: 'getFirestoreWebsite',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
