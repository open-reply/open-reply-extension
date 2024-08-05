// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { database } from './config'
import isAuthenticated from './utils/isAuthenticated'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

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
