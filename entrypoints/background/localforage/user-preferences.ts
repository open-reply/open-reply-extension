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
  const cachedUserPreferences = await getCachedUserPrerences()
  const newUserPreferences = {
    ...cachedUserPreferences,
    ..._userPreferences,
    safety: {
      ...cachedUserPreferences.safety,
      ..._userPreferences.safety,
      websiteWarning: {
        ...cachedUserPreferences.safety?.websiteWarning,
        ..._userPreferences.safety?.websiteWarning,
      },
    },
    moderation: {
      ...cachedUserPreferences.moderation,
      ..._userPreferences.moderation,
    },
    appearance: {
      ...cachedUserPreferences.appearance,
      ..._userPreferences.appearance,
    },
    _lastUpdatedLocally: Date.now()
  } as Local<UserPreferences>
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USER_PREFERENCES, newUserPreferences)
}
