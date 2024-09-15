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
 */
export const _getFirestoreReport = async (reportID: ReportID): Promise<Returnable<Report | undefined, Error>> => {
  try {
    return returnable.success(
      (
        await getDoc(doc(firestore, FIRESTORE_DATABASE_PATHS.REPORTS.INDEX, reportID)) as DocumentSnapshot<Report>
      ).data()
    )
  } catch (error) {
    logError({
      functionName: '_getFirestoreReport',
      data: reportID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
