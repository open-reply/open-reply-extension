// Imports:
import type { UID } from './user'

// Exports:
/**
 * The `RealtimeDatabaseUser` interface defines the partial details of a user.
 * 
 * A user's profile picture can be accessed using `<STORAGE_BUCKET>/users/{UID}.png`
 */
export interface RealtimeDatabaseUser {
  /**
   * The username of the user.
   * 
   * @optional
   */
  username?: string

  /**
   * The full name of the user.
   * 
   * @optional
   */
  fullName?: string
}

export interface RealtimeDatabaseSchema {
  users: Record<UID, RealtimeDatabaseUser>
  usernames: Record<string, UID>
}
