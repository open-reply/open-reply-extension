// Packages:
import { auth, functions } from '../..'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { Returnable } from 'types'
import type { UID } from 'types/user'

// Exports:
/**
 * Mute a user.
 */
export const muteUser = async (UID: UID): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const muteUser = httpsCallable(functions, 'muteUser')

    const response = (await muteUser({ UID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'muteUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}


// unmuteUser