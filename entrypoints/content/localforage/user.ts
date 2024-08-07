// Packages:
import localforage from 'localforage'

// Typescript:
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import type { UID } from 'types/user'

// Constants:
import { type Local, LOCAL_FORAGE_SCHEMA } from '.'

// Exports:
/**
 * Fetch all the users from Realtime Database that have been cached locally.
 */
export const getCachedRDBUsers = async (): Promise<Record<UID, Local<RealtimeDatabaseUser>>> => {
  const users = await localforage.getItem<Record<UID, Local<RealtimeDatabaseUser>>>(LOCAL_FORAGE_SCHEMA.USERS)
  return users ? users : {}
}

/**
 * Fetch a user from Realtime Database that have been cached locally.
 */
export const getCachedRDBUser = async (UID: string): Promise<Local<RealtimeDatabaseUser> | null> => {
  const users = await getCachedRDBUsers()
  const user = users[UID]
  return user ? user : null
}

/**
 * Cache a user from Realtime Database locally.
 */
export const setCachedRDBUser = async (UID: string, RDBUser: RealtimeDatabaseUser) => {
  const users = await getCachedRDBUsers()
  users[UID] = { ...RDBUser, _lastUpdatedLocally: Date.now() }
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USERS, users)
}
