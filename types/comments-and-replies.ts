// Imports:
import type { Timestamp } from 'firebase/firestore'
import type { FlatUser, UID } from './user'
import type { Vote, VoteCount } from 'types'

// Exports:
/**
 * Defines the Comment ID, only useful for development.
 */
export type CommentID = string

/**
 * Defines the ReplyID, only useful for development.
 */
export type ReplyID = string

/**
 * Defines the ReportID, only useful for development.
 */
export type ReportID = string


/**
 * The `Report` interface defines a report made against a comment/report.
 */
export interface Report {
  /**
   * The unique `id` of the report, generated using UUID V4.
   */
  id: ReportID

  /**
   * The user that made the report.
   */
  reporter: FlatUser
  
  /**
   * The reason behind the report. Can be one of `REPORT_REASONS` or a custom max 200 character reason.
   */
  reason: string
}

/**
 * The `Reports` interface defines the reports against a comment/reply.
 */
export interface Reports {
  /**
   * An array of all the ReportIDs.
   * 
   * The maximum length of this array should be less than or equal to `MAX_COMMENT_REPORT_COUNT` or `MAX_REPLY_REPORT_COUNT`.
   */
  reports: ReportID[]

  /**
   * Indicates how many reports have been made so far.
   * 
   * If `reportCount` > `MAX_COMMENT_REPORT_COUNT` or `MAX_REPLY_REPORT_COUNT`, a new report cannot be made.
   */
  reportCount: number
}

/**
 * The `Restriction` interface defines the details regarding a manual restriction for certain suspicious comments.
 * 
 * **NOTE: This is a planned feature.**
 */
export interface Restriction {
  /**
   * Special user that has the permissions, that restricts a particular comment.
   */
  restrictor: FlatUser
  
  /**
   * The reason behind why the comment/reply is being restricted.
   * 
   * @optional
   */
  reason?: string
  
  /**
   * Timestamp for when the comment/reply was restricted.
   */
  restrictedOn: Timestamp
}


/**
 * The `Comment` interface defines a comment on **OpenReply**.
 */
export interface Comment {
  /**
   * The `replies` sub-collection contains all the replies that have been made to the comment.
   */
  'replies': Record<ReplyID, Reply>

  /**
   * The `votes` sub-collection tracks all the votes made to the comment. It uses the UID as the key, as only one vote can be casted per comment per user.
   */
  'votes': Record<UID, Vote>


  /**
   * This `id` uniquely identifies a comment, and is generated using UUID V4.
   */
  id: CommentID

  /**
   * The SHA512 Hash of the URL (except fragments) on which the comment was posted.\
   * The URLHash is also used as the unique `id` for websites.
   */
  URLHash: string


  /**
   * The domain, not the page, on which the comment was posted.\
   * It consists of the subdomain, domain, the TLD, and the port number (if present).
   * 
   * **Example**: `www.example.co.uk:443` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
   */
  domain: string

  /**
   * The full URL (except fragments) on which the comment was posted.
   * 
   * **Example**: `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
   */
  URL: string


  /**
   * Contains the plaintext body of the comment.
   */
  body: string
  
  /**
   * The user that posted the comment.
   */
  author: FlatUser


  /**
   * Keeps track of the number of upvotes, downvotes, and additional statistics.
   */
  voteCount: VoteCount
  
  /**
   * Keeps a count of all the replies that have been made to this comment.
   * 
   * Note that we don't store the replies in an array, for two reasons:
   * - There may be more replies than what a Firestore field can handle. The size limit is 1 MiB (1,048,576 bytes).
   * - Pagination is not possible, so loading a comment would mean loading all of its replies as well.
   */
  replyCount: number


  /**
   * Keeps track of reports made by any user against the comment.
   * 
   * @optional
   */
  report?: Reports


  /**
   * Timestamp for when the comment was created.
   */
  createdAt: Timestamp
  
  /**
   * Timestamp for when the comment was last edited.
   */
  lastEditedAt: Timestamp

  
  /**
   * Useful for restricting certain suspicious comments manually.
   * 
   * Note that normal users cannot and should not be able to change this.\
   * This is a planned feature for the future.
   * 
   * @optional
   */
  isRestricted?: boolean
  
  /**
   * Details regarding a manual restriction, if present.
   * 
   * Note that normal users cannot and should not be able to change this.\
   * This is a planned feature for the future.
   * 
   * @optional
   */
  restriction?: Restriction
}

/**
 * The `Reply` interface defines a reply on **OpenReply**.
 */
export interface Reply {
  /**
   * The `votes` sub-collection tracks all the votes made to the reply. It uses the UID as the key, as only one vote can be casted per reply per user.
   */
  'votes': Record<UID, Vote>


  /**
   * This `id` uniquely identifies a reply, and is generated using UUID V4.
   */
  id: ReplyID

  /**
   * The ID of the comment the reply is meant for.
   */
  commentID: CommentID

  /**
   * The SHA512 Hash of the URL (except fragments) on which the comment was posted.\
   * The URLHash is also used as the unique `id` for websites.
   */
  URLHash: string


  /**
   * Contains the plaintext body of the reply.
   */
  body: string
  
  /**
   * The user that posted the reply.
   */
  author: FlatUser


  /**
   * Keeps track of the number of upvotes, downvotes, and additional statistics.
   */
  voteCount: VoteCount


  /**
   * Keeps track of reports made by any user against the reply.
   * 
   * @optional
   */
  report?: Reports


  /**
   * Timestamp for when the reply was created.
   */
  createdAt: Timestamp
  
  /**
   * Timestamp for when the reply was last edited.
   */
  lastEditedAt: Timestamp

  
  /**
   * Useful for restricting certain suspicious reply manually.
   * 
   * Note that normal users cannot and should not be able to change this.\
   * This is a planned feature for the future.
   * 
   * @optional
   */
  isRestricted?: boolean
  
  /**
   * Details regarding a manual restriction, if present.
   * 
   * Note that normal users cannot and should not be able to change this.\
   * This is a planned feature for the future.
   * 
   * @optional
   */
  restriction?: Restriction
}
