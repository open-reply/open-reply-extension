// Imports:
import type { Votes } from 'types/votes'
import type { UID } from './user'
import type {
  URLHash,
  RealtimeDatabaseWebsiteFlagInfo,
  RealtimeDatabaseWebsiteCategory,
} from './websites'
import type { CommentID, ReplyID } from './comments-and-replies'

// Exports:
/**
 * The `RealtimeDatabaseUser` interface defines the details of a user.
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
  websites?: Record<URLHash, Votes>
  comments?: Record<CommentID, Votes>
  replies?: Record<ReplyID, Votes>
}

/**
 * The `RealtimeDatabaseWebsite` interface defines the details of a website.
 */
export interface RealtimeDatabaseWebsite {
  /**
   * The number of times this website has been visited.
   * 
   * @optional
   */
  impressions?: number

  /**
   * Stores all the info related to flags on the website.
   * 
   * It is susciptible to "churn" - wherein, if the calculated `riskScore` is below 5, and it has been 180 days since the last report, some of the values are "reset".
   * 
   * @optional
   */
  flagInfo?: RealtimeDatabaseWebsiteFlagInfo

  /**
   * Keeps a count of all the comments that have been made to this website.
   * 
   * Note that we don't store the comments in an array, for two reasons:
   * - There may be more comments than what a Firestore field can handle. The size limit is 1 MiB (1,048,576 bytes).
   * - Pagination is not possible, so loading a comment would mean loading all of its comments as well.
   * 
   * @optional
   */
  commentCount?: number

  /**
   * The category graph describing which category the website belongs to.
   * 
   * Users vote on what category they think a website belongs to.
   * 
   * @optional
   */
  category?: RealtimeDatabaseWebsiteCategory
}

export interface RealtimeDatabaseSchema {
  users: Record<UID, RealtimeDatabaseUser>
  usernames: Record<string, UID>
  votes: RealtimeDatabaseVotes
  websites: Record<URLHash, RealtimeDatabaseWebsite>
}
