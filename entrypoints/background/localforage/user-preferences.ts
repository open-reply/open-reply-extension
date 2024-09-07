// Packages:
import localforage from 'localforage'

// Typescript:
import type { Local } from '.'
import type { UserPreferences } from 'types/user-preferences'

// Constants:
import { LOCAL_FORAGE_SCHEMA } from '.'

// Functions:
/**
 * Fetch the user preferences that have been cached locally.
 */
export const getCachedUserPrerences = async (): Promise<Local<UserPreferences>> => {
  const userPreferences = await localforage.getItem<Local<UserPreferences>>(LOCAL_FORAGE_SCHEMA.USER_PREFERENCES)
  return userPreferences ? userPreferences : {}
}

/**
 * Cache the user preferences locally. It expects the entire `UserPreferences` object, don't send a partial!
 */
export const setCachedUserPrerences = async (_userPreferences: UserPreferences) => {
  const newUserPreferences = { ..._userPreferences, _lastUpdatedLocally: Date.now() }
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USER_PREFERENCES, newUserPreferences)
}
