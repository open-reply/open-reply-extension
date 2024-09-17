// Typescript:
import type { Returnable } from 'types'
import type { Report, ReportID } from 'types/comments-and-replies'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

/**
 * Fetches the report given a reportID from the Firestore Database.
 */
export const getFirestoreReport = async (reportID: ReportID): Promise<Returnable<Report | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Report | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reports.get.getFirestoreReport,
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
      functionName: 'getFirestoreReport',
      data: reportID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
