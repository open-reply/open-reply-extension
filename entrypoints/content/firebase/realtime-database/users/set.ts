// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Update the user in RDB.
 */
export const updateRDBUser = async ({
  username,
  fullName
}: {
  username?: string
  fullName?: string
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUser,
          payload: { username, fullName },
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
      functionName: 'updateRDBUser',
      data: {
        username,
        fullName,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Update the user's username in RDB.
 */
export const updateRDBUsername = async (username: string): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUsername,
          payload: username,
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
      functionName: 'updateRDBUsername',
      data: username,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Update the user's full name in RDB.
 */
export const updateRDBUserFullName = async (fullName: string): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUserFullName,
          payload: fullName,
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
      functionName: 'updateRDBUserFullName',
      data: fullName,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Set the user's bio.
 */
export const updateRDBUserBio = async (bio: string): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUserBio,
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
      functionName: 'updateRDBUserBio',
      data: bio,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
