// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, functions } from '../..'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { Returnable } from 'types'
import type { UID } from 'types/user'

// Exports:
/**
 * Mute a user.
 */
export const _muteUser = async (UID: UID): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const muteUser = httpsCallable(functions, 'muteUser')

    const response = (await muteUser({ UID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_muteUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Unmute a muted user.
 */
export const _unmuteUser = async (UID: UID): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const unmuteUser = httpsCallable(functions, 'unmuteUser')

    const response = (await unmuteUser({ UID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_unmuteUser',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
