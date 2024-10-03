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
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.followUser,
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
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.unfollowUser,
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
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.removeFollower,
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
 * Set the user's date of birth.
 */
export const setUserDateOfBirth = async (dateOfBirth: number): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.setUserDateOfBirth,
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
