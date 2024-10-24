// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'
import { addNotification } from './notification'
import isUsernameValid from 'utils/isUsernameValid'
import isFullNameValid from 'utils/isFullNameValid'
import validateUserBio from 'utils/validateUserBio'
import * as validURL from 'valid-url'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type { FollowerUser, FollowingUser, UID } from 'types/user'
import { FieldValue } from 'firebase-admin/firestore'
import { type Notification, NotificationAction, NotificationType } from 'types/notifications'
import type { FirestoreDatabaseUser } from 'types/firestore.database'
import { ServerValue } from 'firebase-admin/database'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { AVERAGE_MONTH } from 'time-constants'
const MAX_URL_COUNT_PER_USER = 5

// Exports:
/**
 * After a user has signed up, this function helps create the boilerplate RDB user.
 */
export const createRDBUser = async (
  data: null,
  context: CallableContext,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    await database.ref(REALTIME_DATABASE_PATHS.USERS.joinDate(UID)).set(ServerValue.TIMESTAMP)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'createRDBUser' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Update the user in RDB.
 */
export const updateRDBUser = async (
  data: {
    username?: string
    fullName?: string
    bio?: string
    URLs?: Record<number, string>
  },
  context: CallableContext,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    if (data.username) {
      const usernameLastChangedDate = (await database.ref(REALTIME_DATABASE_PATHS.USERS.usernameLastChangedDate(UID)).get()).val() as number | undefined
      if (
        usernameLastChangedDate &&
        usernameLastChangedDate < AVERAGE_MONTH
      ) throw new Error('Please wait for a few more days before changing your username!')

      if (!isUsernameValid(data.username)) throw new Error('Please enter a valid username!')
      
      const oldUsername = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined

      if (data.username !== oldUsername) {
        const isUsernameTaken = (await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(data.username)).get()).exists()

        if (!isUsernameTaken) {
          await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).set(data.username)
          await database.ref(REALTIME_DATABASE_PATHS.USERS.usernameLastChangedDate(UID)).set(ServerValue.TIMESTAMP)
          await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(data.username)).set(UID)
          if (oldUsername) await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(oldUsername)).remove()
        }
      }
    } if (data.fullName) {
      if (!isFullNameValid(data.fullName)) throw new Error('Please enter a valid username!')
      
      await database.ref(REALTIME_DATABASE_PATHS.USERS.fullName(UID)).set(data.fullName)
    } if (data.bio) {
      const { status: validateUserBioStatus } = validateUserBio(data.bio)
      if (!validateUserBioStatus) throw new Error('Please enter a valid bio!')

      await database.ref(REALTIME_DATABASE_PATHS.USERS.bio(UID)).set(data.bio)
    } if (data.URLs) {
      const URLs = Object.values(data.URLs)
      if (URLs.length > MAX_URL_COUNT_PER_USER) throw new Error('You may only add upto 5 URLs!')
      for (const URL of URLs) {
        const untaintedURI = validURL.isWebUri(URL)
        if (untaintedURI === undefined) throw new Error('Please enter valid URLs!')
      }

      await database.ref(REALTIME_DATABASE_PATHS.USERS.URLs(UID)).set(data.URLs)
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

    const usernameLastChangedDate = (await database.ref(REALTIME_DATABASE_PATHS.USERS.usernameLastChangedDate(UID)).get()).val() as number | undefined
    if (
      usernameLastChangedDate &&
      usernameLastChangedDate < AVERAGE_MONTH
    ) throw new Error('Please wait for a few more days before changing your username!')

    if (!data.username) throw new Error('Please enter a valid username!')
    if (!isUsernameValid(data.username)) throw new Error('Please enter a valid username!')
    
    const oldUsername = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined

    if (data.username !== oldUsername) {
      const isUsernameTaken = (await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(data.username)).get()).exists()

      if (!isUsernameTaken) {
        await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).set(data.username)
        await database.ref(REALTIME_DATABASE_PATHS.USERS.usernameLastChangedDate(UID)).set(ServerValue.TIMESTAMP)
        await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(data.username)).set(UID)
        if (oldUsername) await database.ref(REALTIME_DATABASE_PATHS.USERNAMES.UID(oldUsername)).remove()
      }
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

    if (!data.fullName) throw new Error('Please enter a valid name!')
    if (!isFullNameValid(data.fullName)) throw new Error('Please enter a valid username!')

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
    if (data.userToFollow === UID) throw new Error('User cannot follow themselves!')
    
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
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.followingCount(UID))
      .set(ServerValue.increment(1))

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.userToFollow)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX).doc(UID)
      .set({
        followedAt: FieldValue.serverTimestamp(),
        UID,
      } as FollowerUser)
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.followerCount(data.userToFollow))
      .set(ServerValue.increment(1))

    // Send a notification to `userToFollow` that `UID.username` followed them.
    const notification = {
      type: NotificationType.Visible,
      title: `${ username } followed you!`,
      action: NotificationAction.ShowUser,
      payload: {
        UID,
      },
      createdAt: FieldValue.serverTimestamp(),
    } as Notification
    const addNotificationResult = await addNotification(data.userToFollow, notification)
    if (!addNotificationResult.status) throw addNotificationResult.payload

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

    if (!data.userToUnfollow) throw new Error('Please enter a valid userToUnfollow!')
    if (data.userToUnfollow === UID) throw new Error('User cannot unfollow themselves!')
    
    const followingUserRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWING.INDEX).doc(data.userToUnfollow)
    
    const isAlreadyFollowingUser = (await followingUserRef.get()).exists
    if (!isAlreadyFollowingUser) throw new Error('User is not being followed!')
    
    await followingUserRef.delete()
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.followingCount(UID))
      .set(ServerValue.increment(-1))

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.userToUnfollow)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX).doc(UID)
      .delete()
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.followerCount(data.userToUnfollow))
      .set(ServerValue.increment(-1))

    // Send a silent notification to `userToUnfollow` that `UID.username` unfollowed them, so that their caches can be updated.
    const notification = {
      type: NotificationType.Silent,
      action: NotificationAction.UnfollowUser,
      payload: {
        UID,
      },
      createdAt: FieldValue.serverTimestamp(),
    } as Notification
    const addNotificationResult = await addNotification(data.userToUnfollow, notification)
    if (!addNotificationResult.status) throw addNotificationResult.payload

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
    if (data.followerToRemove === UID) throw new Error('User cannot remove themselves as a follower!')
    
    const followerUserRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWERS.INDEX).doc(data.followerToRemove)
    
    const isFollowerFollowingUser = (await followerUserRef.get()).exists
    if (!isFollowerFollowingUser) throw new Error('Follower is not following the user!')
    
    await followerUserRef.delete()
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.followerCount(UID))
      .set(ServerValue.increment(-1))

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.followerToRemove)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.FOLLOWING.INDEX).doc(UID)
      .delete()
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.followingCount(data.followerToRemove))
      .set(ServerValue.increment(-1))

    // Send a silent notification to `followerToRemove` that `UID.username` removed them as a follower, so that their caches can be updated.
    const notification = {
      type: NotificationType.Silent,
      action: NotificationAction.RemoveFollower,
      payload: {
        UID,
      },
      createdAt: FieldValue.serverTimestamp(),
    } as Notification
    const addNotificationResult = await addNotification(data.followerToRemove, notification)
    if (!addNotificationResult.status) throw addNotificationResult.payload

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'removeFollower' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Mute user.
 */
export const muteUser = async (
  data: { UID: UID },
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

    if (!data.UID) throw new Error('Please enter a valid UID to mute!')
    if (UID === data.UID) throw new Error('User cannot mute themselves!')

    await database.ref(REALTIME_DATABASE_PATHS.MUTED.mutedUserOfUser(UID, data.UID)).set(true)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'muteUser' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Unmute a muted user.
 */
export const unmuteUser = async (
  data: { UID: UID },
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

    if (!data.UID) throw new Error('Please enter a valid UID to unmute!')
    if (UID === data.UID) throw new Error('User cannot unmute themselves!')

    await database.ref(REALTIME_DATABASE_PATHS.MUTED.mutedUserOfUser(UID, data.UID)).remove()

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'unmuteUser' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Sets the user's bio.
 */
export const updateRDBUserBio = async (
  data: string,
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
    
    if (!validateUserBio(data).status) throw new Error('Please enter a valid bio!')
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.bio(UID))
      .update(data)
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'updateRDBUserBio' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Sets the user's URLs.
 */
export const updateRDBUserURLs = async (
  data: Record<number, string>,
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
    
    const URLs = Object.values(data)
    if (URLs.length > MAX_URL_COUNT_PER_USER) throw new Error('You may only add upto 5 URLs!')
    for (const URL of URLs) {
      const untaintedURI = validURL.isWebUri(URL)
      if (untaintedURI === undefined) throw new Error('Please enter valid URLs!')
    }

    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.URLs(UID))
      .set(data)
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'updateRDBUserURLs' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Sets the user's date of birth.
 */
export const setUserDateOfBirth = async (
  data: number,
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

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .update({
        dateOfBirth: data
      } as Partial<FirestoreDatabaseUser>)
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'setUserDateOfBirth' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
