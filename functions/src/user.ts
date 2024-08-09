// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type { FollowerUser, FollowingUser, UID } from 'types/user'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { FieldValue } from 'firebase-admin/firestore'

// Exports:
/**
 * Update the user in RDB.
 */
export const updateRDBUser = async (
  data: {
    username?: string
    fullName?: string
  },
  context: CallableContext
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    // TODO: Add username and fullName validations

    if (data.username) {
      const oldUsername = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined

      if (data.username !== oldUsername) {
        const isUsernameTaken = (await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(data.username)).get()).exists()

        if (!isUsernameTaken) await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).set(data.username)
      }
    } if (data.fullName) {
      await database.ref(REALTIME_DATABASE_PATHS.USERS.fullName(UID)).set(data.fullName)
    }

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'updateRDBUser' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Update the user's username in RDB.
 */
export const updateRDBUsername = async (
  data: {
    username: string
  },
  context: CallableContext
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    // TODO: Add username validations

    if (!data.username) throw new Error('Please enter a valid username!')
    
    const oldUsername = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined

    if (data.username !== oldUsername) {
      const isUsernameTaken = (await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(data.username)).get()).exists()

      if (!isUsernameTaken) await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).set(data.username)
    }
    

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'updateRDBUsername' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Update the user's full name in RDB.
 */
export const updateRDBUserFullName = async (
  data: {
    fullName: string
  },
  context: CallableContext
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    // TODO: Add fullName validations

    if (!data.fullName) throw new Error('Please enter a valid name!')
    
    await database.ref(REALTIME_DATABASE_PATHS.USERS.fullName(UID)).set(data.fullName)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'updateRDBUserFullName' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Follow a user.
 */
export const followUser = async (
  data: {
    userToFollow: UID
  },
  context: CallableContext
): Promise<Returnable<FollowingUser, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (!data.userToFollow) throw new Error('Please enter a valid userToFollow!')
    
    const followingUserRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWING.INDEX).doc(data.userToFollow)
    
    const isAlreadyFollowingUser = (await followingUserRef.get()).exists
    if (isAlreadyFollowingUser) throw new Error('User is already being followed!')
    
    const followingUser = {
      followedAt: FieldValue.serverTimestamp(),
      UID: data.userToFollow,
    } as FollowingUser
    await followingUserRef.set(followingUser)

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.userToFollow)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX).doc(UID)
      .set({
        followedAt: FieldValue.serverTimestamp(),
        UID,
      } as FollowerUser)

    // TODO: Send a silent notification to data.userToUnfollow, so that their caches can be updated.

    return returnable.success(followingUser)
  } catch (error) {
    logError({ data, error, functionName: 'followUser' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Unfollow a user.
 */
export const unfollowUser = async (
  data: {
    userToUnfollow: UID
  },
  context: CallableContext
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (!data.userToUnfollow) throw new Error('Please enter a valid userToFollow!')
    
    const followingUserRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWING.INDEX).doc(data.userToUnfollow)
    
    const isAlreadyFollowingUser = (await followingUserRef.get()).exists
    if (!isAlreadyFollowingUser) throw new Error('User is not being followed!')
    
    await followingUserRef.delete()

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.userToUnfollow)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX).doc(UID)
      .delete()

    // TODO: Send a silent notification to data.userToUnfollow, so that their caches can be updated.

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'unfollowUser' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Remove a follower.
 */
export const removeFollower = async (
  data: {
    followerToRemove: UID
  },
  context: CallableContext
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (!data.followerToRemove) throw new Error('Please enter a valid userToFollow!')
    
    const followerUserRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX).doc(data.followerToRemove)
    
    const isFollowerFollowingUser = (await followerUserRef.get()).exists
    if (!isFollowerFollowingUser) throw new Error('Follower is not following the user!')
    
    await followerUserRef.delete()

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.followerToRemove)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWING.INDEX).doc(UID)
      .delete()

    // TODO: Send a silent notification to data.followerToRemove, so that their caches can be updated.

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'removeFollower' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
