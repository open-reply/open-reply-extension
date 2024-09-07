// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { FetchPolicy, Returnable } from 'types'
import type { UserPreferences } from 'types/user-preferences'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Get the user's preferences.
 */
export const getUserPreferences = async ({
  fetchPolicy,
}: {
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<UserPreferences, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<UserPreferences, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.userPreferences.get.getUserPreferences,
          payload: {
            fetchPolicy,
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
      functionName: 'getUserPreferences',
      data: {
        fetchPolicy,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
