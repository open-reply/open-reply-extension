// Imports:
import type { Votes } from 'types/votes'
import type { UID } from './user'
import type {
  URLHash,
  RealtimeDatabaseWebsiteFlagInfo,
  RealtimeDatabaseWebsiteCategory,
} from './websites'
import type {
  CommentID,
  ReplyID,
  Topic,
} from './comments-and-replies'
import type { FlatTopicComment } from './topics'
import type { UserRecentActivity } from './activity'
import type { TopicTaste } from './taste'

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

  // NOTE: This will be deprecated soon.
  /**
   * The category graph describing which category the website belongs to.
   * 
   * Users vote on what category they think a website belongs to.
   * 
   * @optional
   */
  category?: RealtimeDatabaseWebsiteCategory
}

/**
 * The `RealtimeDatabaseTopic` interface defines the full details of an topic.
 * 
 * Each `Topic` is pruned to `STABLE_TOPIC_DOCUMENT_COUNT` documents every week, if it surpasses `MAX_TOPIC_DOCUMENT_COUNT`.
 * 
 * The document contains the current count of all the topics.
 * 
 * TODO: Write the pruning CRON job.
 */
export interface RealtimeDatabaseTopic {
  /**
   * Tracks all the comments under the topic.
   * 
   * @optional
   */
  comments?: {
    /**
     * Keeps a track of the relevant scores of each comment.
     * 
     * @optional
     */
    scores?: Record<CommentID, FlatTopicComment>
    
    /**
     * Keeps a track of the number of comments under this topic.
     * 
     * @optional
     */
    count?: number
  }
}

/**
 * The `RealtimeDatabaseMutedList` interface stores the list of all the users that have been muted by the primary user.
 * 
 * This should only be accessible by the parent UID. TODO: Set Realtime Database Rules for this.
 */
export type RealtimeDatabaseMutedList = Record<UID, boolean>

/**
 * The `RealtimeDatabaseRecentActivity` interface keeps a track of all the recent activities done by every user.
 * 
 * Each `UserRecentActivity` is pruned to `STABLE_RECENT_USER_ACTIVITY_COUNT` documents every week, if it surpasses `MAX_RECENT_USER_ACTIVITY_COUNT`.
 * 
 * TODO: Write the pruning CRON job.
 */
export type RealtimeDatabaseRecentActivity = Record<UID, UserRecentActivity>

/**
 * The `RealtimeDatabaseTaste` interface defines the tastes of an individual user.
 * 
 * It can be used for recommending posts.
 */
export interface RealtimeDatabaseTaste {
  /**
   * Keeps a record of all the topics a user is interested in, against `TopicTaste` containing the **Topic Interest Score** (and associated variables).
   * 
   * The Topic Interest Score can be calculated through `utils/getTopicInterestScore`.
   */
  topics: Record<Topic, TopicTaste>
}

export interface RealtimeDatabaseSchema {
  users: Record<UID, RealtimeDatabaseUser>
  usernames: Record<string, UID>
  votes: RealtimeDatabaseVotes
  websites: Record<URLHash, RealtimeDatabaseWebsite>
  topics: Record<Topic, RealtimeDatabaseTopic>
  muted: Record<UID, RealtimeDatabaseMutedList>
  recentActivity: RealtimeDatabaseRecentActivity
  tastes: Record<UID, RealtimeDatabaseTaste>
}
