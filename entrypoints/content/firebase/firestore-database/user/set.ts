// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { UID } from 'types/user'
import type { Returnable } from 'types'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Follow a user.
 */
export const followUser = async (followingUID: UID): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.followUser,
          payload: followingUID,
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
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.unfollowUser,
          payload: unfollowingUID,
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
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.removeFollower,
          payload: followerUID,
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
      functionName: 'removeFollower',
      data: followerUID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Set the user's bio.
 */
export const setUserBio = async (bio: string): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.setUserBio,
          payload: bio,
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
      functionName: 'setUserBio',
      data: bio,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Set the user's URLs.
 */
export const setUserURLs = async (URLs: string[]): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.setUserURLs,
          payload: URLs,
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
      functionName: 'setUserURLs',
      data: URLs,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Set the user's date of birth.
 */
export const setUserDateOfBirth = async (dateOfBirth: number): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.setUserDateOfBirth,
          payload: dateOfBirth,
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
      functionName: 'setUserDateOfBirth',
      data: dateOfBirth,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
