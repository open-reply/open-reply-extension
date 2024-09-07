// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types'
import type { UserPreferences } from 'types/user-preferences'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Set the user's preferences.
 */
export const setUserPreferences = async ({
  userPreferences
}: {
  userPreferences: Partial<UserPreferences>
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.userPreferences.set.setUserPreferences,
          payload: {
            userPreferences,
          },
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
      functionName: 'setUserPreferences',
      data: {
        userPreferences,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
