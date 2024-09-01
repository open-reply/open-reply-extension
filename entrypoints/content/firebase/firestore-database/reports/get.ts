// Typescript:
import type { DocumentSnapshot } from 'firebase/firestore'
import type { Returnable } from 'types'
import type { Report, ReportID } from 'types/comments-and-replies'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

/**
 * Fetches the report snapshot given a reportID from the Firestore Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getFirestoreReportSnapshot = async (reportID: ReportID): Promise<Returnable<DocumentSnapshot<Report>, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<DocumentSnapshot<Report>, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reports.get.getFirestoreReportSnapshot,
          payload: reportID
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
      functionName: 'getFirestoreReportSnapshot',
      data: reportID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
