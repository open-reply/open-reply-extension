// Packages:
import logError from 'utils/logError'
import returnable from 'utils/returnable'
import { firestore } from './config'

// Typescript:
import type { Returnable } from 'types/index'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<Returnable<null, Error>> => {
  try {
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.MAIL.INDEX)
      .add({
        to,
        message: {
          subject,
          html,
        },
      })

    return returnable.success(null)
  } catch (error) {
    logError({
      data: {
        to,
        subject,
        html,
      },
      error,
      functionName: 'sendEmail'
    })
    return returnable.fail(error as Error)
  }
}
