// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { setCachedUserPrerences } from '@/entrypoints/background/localforage/user-preferences'
import { _getFirestoreUserSnapshot } from '../user/get'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { Returnable } from 'types/index'
import type { UserPreferences } from 'types/user-preferences'

// Exports:
/**
 * Set the user's preferences.
 */
export const _setUserPreferences = async ({
  userPreferences
}: {
  userPreferences: Partial<UserPreferences>
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const setUserPreferences = httpsCallable(functions, 'setUserPreferences')

    const response = (await setUserPreferences({ userPreferences })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedUserPrerences(userPreferences)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_setUserPreferences',
      data: {
        userPreferences,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
