// Packages:
import localforage from 'localforage'

// Typescript:
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import type { UID } from 'types/user'

// Constants:
import { LOCAL_FORAGE_SCHEMA } from '.'

// Exports:
export const getCachedRDBUsers = async (): Promise<Record<UID, RealtimeDatabaseUser>> => {
  const users = await localforage.getItem<Record<UID, RealtimeDatabaseUser>>(LOCAL_FORAGE_SCHEMA.USERS)
  return users ? users : {}
}

export const getCachedRDBUser = async (UID: string): Promise<RealtimeDatabaseUser | null> => {
  const users = await getCachedRDBUsers()
  const user = users[UID]
  return user ? user : null
}

export const setCachedRDBUser = async (UID: string, RDBUser: RealtimeDatabaseUser) => {
  const users = await getCachedRDBUsers()
  users[UID] = RDBUser
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.USERS, users)
}

// export const getCachedRDBUserLastUpdated = async (UID: string) => {
//   const _users = await localforage.getItem<Record<UID, number>>(LOCAL_FORAGE_SCHEMA._USERS) ?? {}
//   const userLastUpdated = _users[UID] as number | undefined
// }
