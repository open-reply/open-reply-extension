// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, functions } from '../..'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import {
  addCachedFollowing,
  removeCachedFollower,
  removeCachedFollowing,
} from '@/entrypoints/background/localforage/follow'

// Typescript:
import type { FollowingUser, UID } from 'types/user'
import type { Returnable } from 'types'

// Exports:
/**
 * Follow a user.
 */
export const _followUser = async (followingUID: UID): Promise<Returnable<null, Error>> => {
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
      functionName: '_followUser',
      data: followingUID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Unfollow a user
 */
export const _unfollowUser = async (unfollowingUID: UID): Promise<Returnable<null, Error>> => {
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
      functionName: '_unfollowUser',
      data: unfollowingUID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Remove a follower.
 */
export const _removeFollower = async (followerUID: UID): Promise<Returnable<null, Error>> => {
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
      functionName: '_removeFollower',
      data: followerUID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
