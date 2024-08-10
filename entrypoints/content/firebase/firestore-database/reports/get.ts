// Packages:
import { firestore } from '../..'
import { doc, DocumentSnapshot, getDoc } from 'firebase/firestore'

// Typescript:
import type { Returnable } from 'types'
import type { Report, ReportID } from 'types/comments-and-replies'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

/**
 * Fetches the report snapshot given a reportID from the Firestore Database.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getFirestoreReportSnapshot = async (reportID: ReportID): Promise<Returnable<DocumentSnapshot<Report>, Error>> => {
  try {
    return returnable.success(await getDoc(doc(firestore, FIRESTORE_DATABASE_PATHS.REPORTS.INDEX, reportID)) as DocumentSnapshot<Report>)
  } catch (error) {
    logError({
      functionName: 'getFirestoreReportSnapshot',
      data: reportID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
