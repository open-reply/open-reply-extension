// Packages:
import { auth, functions } from '../..'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import {
  addCachedFollowing,
  removeCachedFollower,
  removeCachedFollowing,
} from '@/entrypoints/content/localforage/follow'

// Typescript:
import type { FollowingUser, UID } from 'types/user'
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

    const response = (await followUser({ userToFollow: followingUID })).data as Returnable<FollowingUser, string>
    if (!response.status) throw new Error(response.payload)

    await addCachedFollowing(followingUID, response.payload)

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

/**
 * Unfollow a user
 */
export const unfollowUser = async (unfollowingUID: UID): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const unfollowUser = httpsCallable(functions, 'unfollowUser')

    const response = (await unfollowUser({ userToUnfollow: unfollowingUID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await removeCachedFollowing(unfollowingUID)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'unfollowUser',
      data: unfollowingUID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Remove a follower.
 */
export const removeFollower = async (followerUID: UID): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const removeFollower = httpsCallable(functions, 'removeFollower')

    const response = (await removeFollower({ followerToRemove: followerUID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await removeCachedFollower(followerUID)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'removeFollower',
      data: followerUID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
