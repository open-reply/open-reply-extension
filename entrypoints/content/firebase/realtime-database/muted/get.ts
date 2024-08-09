// Packages:
import { auth, database } from '../..'
import { get, ref } from 'firebase/database'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'

// Typescript:
import type { Returnable } from 'types'
import type { UID } from 'types/user'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Get a list of all the users muted by the authenticated user.
 * 
 * Note: This loads **all** the muted users, without any pagination or limiting.
 */
export const getAllMutedUsers = async (): Promise<Returnable<UID[], Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const mutedUsersRef = ref(database, REALTIME_DATABASE_PATHS.MUTED.mutedUsers(auth.currentUser.uid))
    const mutedUsersSnapshot = await get(mutedUsersRef)
    const mutedUsers: UID[] = []

    mutedUsersSnapshot.forEach(mutedUserSnapshot => {
      const isMuted = mutedUserSnapshot.val() as boolean
      if (isMuted) mutedUsers.push(mutedUserSnapshot.key as UID)
    })

    return returnable.success(mutedUsers)
  } catch (error) {
    logError({
      functionName: 'getAllMutedUsers',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
