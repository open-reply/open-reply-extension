/**
 * NOTE: Any stringified key, for example - 'submitted-comments' - represents a
 * subcollection within that collection.
 */

// Imports:
import type {
  UID,
  FlatComment,
  FlatReply,
  FlatReport,
  FollowerUser,
  FollowingUser,
} from './user'
import type {
  URLHash,
  WebsiteFlag,
} from './websites'
import type {
  Comment,
  CommentID,
  ReplyID,
  Report,
  ReportID,
} from './comments-and-replies'
import { type FieldValue } from 'firebase/firestore'
import type {
  NotificationID,
  Notification,
} from './notifications'
import type { VoteCount } from './votes'
import type {
  WebsiteBookmark,
  CommentBookmark,
  ReplyBookmark,
} from './bookmarks'

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

  /**
   * The `reports` sub-collection tracks all the reports submitted by the user for comments and replies, by storing them in a "flat" manner.
   */
  'reports': Record<ReportID, FlatReport>

  /**
   * The `followers` sub-collection tracks all the users following this user.
   */
  'followers': Record<UID, FollowerUser>

  /**
   * The `following` sub-collection tracks all the users that this user is following.
   */
  'following': Record<UID, FollowingUser>

  /**
   * The `bookmarked-websites` sub-collection tracks all the websites bookmarked by this user.
   */
  'bookmarked-websites': Record<URLHash, WebsiteBookmark>

  /**
   * The `bookmarked-comments` sub-collection tracks all the comments bookmarked by this user.
   */
  'bookmarked-comments': Record<CommentID, CommentBookmark>

  /**
   * The `bookmarked-replies` sub-collection tracks all the replies bookmarked by this user.
   */
  'bookmarked-replies': Record<ReplyID, ReplyBookmark>
}

/**
 * The `FirestoreDatabaseUser` interface defines the queryable details of a user, excluding the subcollections.
 */
export interface FirestoreDatabaseUser extends Omit<
  _FirestoreDatabaseUser,
  'comments' | 'replies' | 'notifications' | 'reports' | 'followers' | 'following'
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
   * The `flags` sub-collection tracks all the flags raised for the website by users.
   */
  'flags': Record<UID, WebsiteFlag>

  /**
   * The UID of the user that indexed the website.
   */
  indexor: UID

  /**
   * Timestamp for when the website was indexed.
   */
  indexedOn: FieldValue

  /**
   * The full URL (except fragments) on which the comment was posted.
   * 
   * **Example**: `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
   */
  URL: string

  /**
   * Keeps track of the number of upvotes, downvotes, and additional statistics.
   */
  voteCount: VoteCount

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
   * The SEO keywords of the website.
   * 
   * @optional
   */
  keywords?: string[]

  /**
   * The URL for the SEO image card of the website.
   * 
   * @optional
   */
  image?: string

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
  'comments' | 'flags'
> {}

export interface FirebaseDatabaseSchema {
  users: Record<UID, _FirestoreDatabaseUser>
  websites: Record<URLHash, _FirestoreDatabaseWebsite>
  reports: Record<ReportID, Report>
  mail: Record<string, any>
}
