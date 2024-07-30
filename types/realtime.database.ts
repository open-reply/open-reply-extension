// Imports:
import type { UID } from './user'

// Exports:
export interface RealtimeDatabaseUser {
  username?: string
  fullName?: string
}

export interface RealtimeDatabaseSchema {
  users: Record<UID, RealtimeDatabaseUser>
  usernames: Record<string, UID>
}
