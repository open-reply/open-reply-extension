// Imports:
import type { RealtimeVotes } from 'types/votes'
import type { RealtimeUserVerificationStatus, UID } from './user'
import type {
  URLHash,
  RealtimeDatabaseWebsiteFlagInfo,
} from './websites'
import type {
  CommentID,
  ReplyID,
  Topic,
} from './comments-and-replies'
import type { FlatTopicComment } from './topics'
import type { UserRecentActivity } from './activity'
import type { TopicTaste } from './taste'
import type { RealtimeBookmarkStats } from './bookmarks'
import { NotificationID } from './notifications'

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

  /**
   * Tracks user verification status.
   * 
   * @optional
   */
  verification?: RealtimeUserVerificationStatus

  /**
   * The user's bio.
   * 
   * @optional
   */
  bio?: string

  /**
   * Keeps track of the number of users that follow this user.
   * 
   * @optional
   */
  followerCount?: number

  /**
   * Keeps track of the number of users followed by this user.
   * 
   * @optional
   */
  followingCount?: number

  /**
   * The UNIX timestamp in milliseconds when the user joined OpenReply.
   *
   * @optional
   */
  joinDate?: number

  /**
   * The UNIX timestamp in milliseconds for when the user last changed their username.
   */
  usernameLastChangedDate?: number

  /**
   * URLs on the user's profile, stored as a map.
   */
  URLs?: Record<number, string>

  /**
   * Keeps a track of the number of comments made by the user.
   */
  commentCount?: number

  /**
   * Keeps a track of the number of replies made by the user.
   */
  replyCount?: number

  /**
   * Keeps a track of all the topics the user has talked about (through comments, not through replies).
   */
  talksAbout?: Record<Topic, number>
}

/**
 * The `RealtimeDatabaseVotes` interface defines the votes made to websites, comments, and replies.
 */
export interface RealtimeDatabaseVotes {
  websites?: Record<URLHash, RealtimeVotes>
  comments?: Record<CommentID, RealtimeVotes>
  replies?: Record<ReplyID, RealtimeVotes>
}

/**
 * Keeps a track of the Website Topic Score, and variables used to generated it.
 */
export interface WebsiteTopic {
  /**
   * The number of upvotes the user has given for this topic via voting on comments.
   * 
   * Note that, if a comment the user upvoted is edited after the fact to something else (implying a new Topic[] for the comment/reply) - then this still remains unchanged, because we're measuring what the user upvoted *at that time*.
   */
  upvotes: number

  /**
   * The number of downvotes the user has given for this topic via voting on comments.
   * 
   * Note that, if a comment the user downvoted is edited after the fact to something else (implying a new Topic[] for the comment/reply) - then this still remains unchanged, because we're measuring what the user downvoted *at that time*.
   */
  downvotes: number

  /**
   * The **Website Topic Score** ∈ [0, 100], generated via the following:
   * 
   * ```ts
   * score = 100 * (1 - e^(-(e^(1 / 3) * (u - d)) / totalVotesOnCommentsOnWebsite))
   * ```
   * 
   * Where `totalVotesOnCommentsOnWebsite` is the `website/totalVotesOnComments` value - the larger this number, the more difficult it is for a new topic to grow in size.
   */
  score: number
}

/**
 * Contains all the SEO related information regarding a website.
 */
export interface RealtimeDatabaseWebsiteSEO {
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

  /**
   * Represents whether or not the website contains NSFW content.
   */
  isNSFW?: boolean

  /**
   * Stores when the SEO information was captured. Can be used to determine if an update is necessary.
   */
  capturedAt?: number

  /**
   * Stores the UID of the user that captured the website SEO details.
   */
  capturedBy?: UID
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
   * Keeps a track of the Website Topic Score, and variables used to generated it.
   */
  topics: Record<Topic, WebsiteTopic>

  /**
   * Tracks the absolute value of all the votes on all the comments under this website.
   * 
   * An upvote would imply +1, and so would a downvote, but a revert would imply a -1.
   */
  totalVotesOnComments?: number

  /**
   * Contains all the SEO related information regarding a website.
   * 
   * @optional
   */
  SEO?: RealtimeDatabaseWebsiteSEO
}

/**
 * The `RealtimeDatabaseTopic` interface defines the full details of an topic.
 * 
 * Each `Topic.comments.scores` is pruned to `STABLE_TOPIC_COMMENT_COUNT` documents weekly, if it surpasses `MAX_TOPIC_COMMENT_COUNT`.
 * 
 * The document contains the current count of all the topics.
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
 */
export type RealtimeDatabaseMutedList = Record<UID, boolean>

/**
 * The `RealtimeDatabaseRecentActivity` interface keeps a track of all the recent activities done by every user.
 * 
 * Each `UserRecentActivity` is pruned to `STABLE_RECENT_USER_ACTIVITY_COUNT` documents weekly, if it surpasses `MAX_RECENT_USER_ACTIVITY_COUNT`.
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
   * The Topic Interest Score can be calculated through `utils/getTopicTasteScore`.
   */
  topics: Record<Topic, TopicTaste>
}

/**
 * The `RealtimeNotification` interface keeps track of all user-related notifications statistics.
 */
export interface RealtimeNotification {
  /**
   * Keeps a track of the number of notifications in the `notifications` sub-collection of the user in Firestore.
   */
  notificationCount?: number

  /**
   * Keeps track of the last Notification read by the user. This can be treated as a cursor.
   */
  lastRead?: NotificationID

  /**
   * Keeps track of the number of unread notifications.
   */
  unreadCount?: number
}

/**
 * The `RealtimeDatabaseBookmarks` interface defines the bookmarks made on websites, comments, and replies.
 */
export interface RealtimeDatabaseBookmarks {
  websites?: Record<URLHash, RealtimeBookmarkStats>
  comments?: Record<CommentID, RealtimeBookmarkStats>
  replies?: Record<ReplyID, RealtimeBookmarkStats>
}

export interface RealtimeDatabaseSchema {
  users: Record<UID, RealtimeDatabaseUser>
  usernames: Record<string, UID>
  votes: RealtimeDatabaseVotes
  websites: Record<URLHash, RealtimeDatabaseWebsite>
  topics: Record<Topic, RealtimeDatabaseTopic>
  muted: Record<UID, RealtimeDatabaseMutedList>
  recentActivity: RealtimeDatabaseRecentActivity
  recentActivityCount: Record<UID, number>
  tastes: Record<UID, RealtimeDatabaseTaste>
  bookmarks: RealtimeDatabaseBookmarks
  notifications: Record<UID, RealtimeNotification>
}
