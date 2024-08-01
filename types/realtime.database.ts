// Imports:
import type { VotesInfo } from 'types/votes'
import type { UID } from './user'
import type { URLHash } from './websites'
import type { CommentID, ReplyID } from './comments-and-replies'

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

/**
 * The `RealtimeDatabaseVotes` interface defines the votes made to websites, comments, and replies.
 */
export interface RealtimeDatabaseVotes {
  websites: Record<URLHash, VotesInfo>
  comments: Record<CommentID, VotesInfo>
  replies: Record<ReplyID, VotesInfo>
}

export interface RealtimeDatabaseSchema {
  users: Record<UID, RealtimeDatabaseUser>
  usernames: Record<string, UID>
  votes: RealtimeDatabaseVotes
}
