// Packages:
import logError from 'utils/logError'
import returnable from 'utils/returnable'
import isAuthenticated from './utils/isAuthenticated'
import { auth, database, firestore } from './config'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'

// Typescript:
import type { CallableContext } from 'firebase-functions/v1/https'
import type { UserPreferences } from 'types/user-preferences'
import type { Returnable } from 'types/index'
import type { FirestoreDatabaseUser } from 'types/firestore.database'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Set the user's preferences.
 */
export const setUserPreferences = async (
  data: {
    userPreferences: UserPreferences
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

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
      .update({
        preferences: data.userPreferences
      } as Partial<FirestoreDatabaseUser>)
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'setUserPreferences' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
