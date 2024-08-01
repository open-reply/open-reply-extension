/**
 * NOTE: Any stringified key, for example - 'submitted-comments' - represents a
 * subcollection within that collection.
 */

// Imports:
import type {
  UID,
  FlatComment,
  FlatReply,
} from './user'
import type { URLHash } from './websites'
import type {
  Comment,
  CommentID,
  ReplyID,
  ReportID,
} from './comments-and-replies'
import { type Timestamp } from 'firebase/firestore'
import type { Vote, VoteCount } from 'types/votes'
import type {
  NotificationID,
  Notification,
} from './notifications'

// Exports:
/**
 * The `_FirestoreDatabaseUser` interface defines the full details of a user, including the subcollections.
 */
export interface _FirestoreDatabaseUser {
  /**
   * The `comments` sub-collection tracks all the comments made by the user, by storing them in a "flat" manner.
   */
  'comments': Record<CommentID, FlatComment>

  /**
   * The `replies` sub-collection tracks all the replies made by the user, by storing them in a "flat" manner.
   */
  'replies': Record<ReplyID, FlatReply>

  /**
   * The `notifications` sub-collection saves the recent 100 notifications received by the user.
   */
  'notifications': Record<NotificationID, Notification>
}

/**
 * The `FirestoreDatabaseUser` interface defines the queryable details of a user, excluding the subcollections.
 */
export interface FirestoreDatabaseUser extends Omit<
  _FirestoreDatabaseUser,
  'comments' | 'replies' | 'notifications'
> {}

/**
 * The `_FirestoreDatabaseWebsite` interface defines the full details of an indexed website, including the subcollections.
 */
export interface _FirestoreDatabaseWebsite {
  /**
   * The `comments` sub-collection tracks all the comments made to the website.
   */
  'comments': Record<CommentID, Comment>


  /**
   * The UID of the user that indexed the website.
   */
  indexor: UID

  /**
   * Timestamp for when the website was indexed.
   */
  indexedOn: Timestamp


  /**
   * Keeps track of the number of upvotes, downvotes, and additional statistics.
   */
  voteCount: VoteCount

  /**
   * Keeps a count of all the comments that have been made to this website.
   * 
   * Note that we don't store the comments in an array, for two reasons:
   * - There may be more comments than what a Firestore field can handle. The size limit is 1 MiB (1,048,576 bytes).
   * - Pagination is not possible, so loading a comment would mean loading all of its comments as well.
   */
  commentCount: number


  /**
   * The full URL (except fragments) on which the comment was posted.
   * 
   * **Example**: `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
   */
  URL: string

  /**
   * The title of the website.
   * 
   * @optional
   */
  title?: string

  /**
   * The description of the website. This can come from the meta tags, or be generated using AI.
   * 
   * @optional
   */
  description?: string

  /**
   * The favicon icon of the website.
   * 
   * @optional
   */
  favicon?: string
}

/**
 * The `FirestoreDatabaseUser` interface defines the queryable details of an indexed website, excluding the subcollections.
 */
export interface FirestoreDatabaseWebsite extends Omit<
  _FirestoreDatabaseWebsite,
  'votes' | 'comments'
> {}

export interface FirebaseDatabaseSchema {
  users: Record<UID, _FirestoreDatabaseUser>
  websites: Record<URLHash, _FirestoreDatabaseWebsite>
  reports: Record<ReportID, Report>
}
