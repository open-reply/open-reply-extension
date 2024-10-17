// Imports:
import { FieldValue } from 'firebase/firestore'
import type { URLHash } from './websites'
import type { CommentID, ReplyID } from './comments-and-replies'

// Exports:
/**
 * Defines the Activity ID, only useful for development.
 */
export type ActivityID = string

/**
 * All the types of activities that can occur.
 */
export enum ActivityType {
  Upvoted,
  Downvoted,
  CommentedOnWebsite,
  RepliedToComment,
  RepliedToReply,
}

/**
 * The base activity interface.
 */
export interface _Activity {
  /**
   * The Timestamp for when the activity took place.
   */
  activityAt: number
}

/**
 * The activity interface for interactions with websites.
 */
export interface WebsiteActivity extends _Activity {
  /**
   * The type of activity that occured.
   */
  type: ActivityType.Upvoted | ActivityType.Downvoted

  /**
   * The URL Hash of the website the activity happened on.
   */
  URLHash: URLHash
}

/**
 * The activity interface for interactions with comments.
 */
export interface CommentActivity extends _Activity {
  /**
   * The type of activity that occured.
   */
  type: ActivityType.Upvoted | ActivityType.Downvoted | ActivityType.CommentedOnWebsite

  /**
   * The URL Hash of the website the activity happened on.
   */
  URLHash: URLHash

  /**
   * The ID of the comment the activity happened on.
   */
  commentID: CommentID
}

/**
 * The activity interface for interactions with replies.
 */
export interface ReplyActivity extends _Activity {
  /**
   * The type of activity that occured.
   */
  type: ActivityType.Upvoted | ActivityType.Downvoted | ActivityType.RepliedToComment | ActivityType.RepliedToReply

  /**
   * The URL Hash of the website the activity happened on.
   */
  URLHash: URLHash

  /**
   * The ID of the comment the activity happened on.
   */
  commentID: CommentID

  /**
   * The ID of the primary reply that the activity happened on.
   */
  primaryReplyID: ReplyID

  /**
   * The ID of the secondary reply that the activity happened on.
   * 
   * If `type: ActivityType.RepliedToReply`, then this is the reply that the user's reply is replying to.
   * 
   * @optional
   */
  secondaryReplyID?: ReplyID
}

/**
 * The type consolidating all types of activity.
 */
export type Activity =
  WebsiteActivity |
  CommentActivity |
  ReplyActivity

/**
 * Keeps a track of all the recent activities done by a user.
 */
export type UserRecentActivity = Record<ActivityID, Activity>
