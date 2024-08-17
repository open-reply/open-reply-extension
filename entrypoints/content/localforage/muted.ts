// Packages:
import localforage from 'localforage'

// Typescript:
import type { UID } from 'types/user'

// Constants:
import { LOCAL_FORAGE_SCHEMA } from '.'

// Exports:
/**
 * Fetch all the muted users that have been cached locally.
 */
export const getCachedMutedBUsersList = async (): Promise<UID[]> => {
  const users = await localforage.getItem<Record<UID, boolean>>(LOCAL_FORAGE_SCHEMA.MUTED) ?? {}
  return Object.keys(users)
}

/**
 * Add a user to the locally cached muted users list.
 */
export const addCachedMutedRDBUser = async (UID: UID) => {
  const users = await localforage.getItem<Record<UID, boolean>>(LOCAL_FORAGE_SCHEMA.MUTED) ?? {}
  users[UID] = true
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USERS, users)
}

/**
 * Remove a user from the locally cached muted users list.
 */
export const removeCachedMutedRDBUser = async (UID: UID) => {
  const users = await localforage.getItem<Record<UID, boolean>>(LOCAL_FORAGE_SCHEMA.MUTED) ?? {}
  delete users[UID]
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USERS, users)
}
