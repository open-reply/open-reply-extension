// Packages:
import { auth, functions } from '../..'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { UID } from 'types/user'
import type { Returnable } from 'types'

// Exports:
/**
 * Follow a user.
 */
export const followUser = async (followingUID: UID): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const followUser = httpsCallable(functions, 'followUser')

    const response = (await followUser({ followingUID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'followUser',
      data: followingUID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

// followUser
// unfollowUser
// removeCachedFollower