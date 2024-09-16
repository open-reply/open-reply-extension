// Typescript:
import type { FieldValue } from 'firebase/firestore'
import type { UID } from './user'
import type { VoteCount } from './votes'
import type { URLHash } from './websites'
import type { ActivityID } from './activity'

// Constants:
import { TOPICS } from 'constants/database/comments-and-replies'

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
 * The conclusion after reviewing a report.
 */
export enum ReportConclusion {
  /**
   * No action has been taken against the reported item.
   */
  NoAction = 'NoAction',

  /**
   * The item has been hidden.
   */
  Hidden = 'Hidden',

  /**
   * The item has been removed.
   */
  Removed = 'Removed',
}

export interface ReportAnalysis {
  riskScore: number
  conclusion: ReportConclusion
  reason?: string
}

/**
 * The `Report` interface defines a report made against a comment/reply.
 */
export interface Report {
  /**
   * The unique `id` of the report, generated using UUID V4.
   */
  id: ReportID

  /**
   * The UID of the user that made the report.
   */
  reporter: UID
  
  /**
   * The reason behind the report. Can be one of `REPORT_REASONS` or a custom max 200 character reason.
   */
  reason: string

  /**
   * Timestamp for when the comment/reply was reported.
   */
  reportedAt: FieldValue

  /**
   * The URL Hash of the website the comment or reply is on.
   */
  URLHash: URLHash

  /**
   * The ID of the comment that is being reported, or the comment whose reply is being reported.
   */
  commentID: CommentID

  /**
   * If the reply is being reported, then this is the ID.
   * 
   * @optional
   */
  replyID?: ReplyID

  /**
   * Marks if the content has been reviewed.
   */
  isReviewed: boolean

  /**
   * The analysis of the report, post-review.
   * 
   * If the content was not present at the time of review, this will be `undefined`.
   * 
   * @optional
   */
  analysis?: ReportAnalysis
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
   * The UID of the Special user that has the permissions, that restricts a particular comment.
   */
  restrictor: UID
  
  /**
   * The reason behind why the comment/reply is being restricted.
   * 
   * @optional
   */
  reason?: string
  
  /**
   * Timestamp for when the comment/reply was restricted.
   */
  restrictedOn: FieldValue
}


/**
 * The `_Comment` interface defines the full details of a comment on **OpenReply**, including the subcollections.
 */
export interface _Comment {
  /**
   * The `replies` sub-collection contains all the replies that have been made to the comment.
   */
  'replies': Record<ReplyID, Reply>


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
   * The UID of the user that posted the comment.
   */
  author: UID

  
  /**
   * Keeps a count of all the replies that have been made to this comment.
   * 
   * Note that we don't store the replies in an array, for two reasons:
   * - There may be more replies than what a Firestore field can handle. The size limit is 1 MiB (1,048,576 bytes).
   * - Pagination is not possible, so loading a comment would mean loading all of its replies as well.
   */
  replyCount: number

  /**
   * Keeps track of the number of upvotes, downvotes, and additional statistics.
   */
  voteCount: VoteCount

  /**
   * The comparative sentiment analysis score.
   */
  sentiment: number

  /**
   * An array of the top 3 topics the comment belongs to.
   */
  topics: Topic[]

  /**
   * Keeps track of reports made by any user against the comment.
   * 
   * @optional
   */
  report?: Reports


  /**
   * Timestamp for when the comment was created.
   */
  createdAt: FieldValue

  /**
   * The ID of the activity associated with the comment creation.
   */
  creationActivityID: ActivityID
  
  /**
   * Timestamp for when the comment was last edited.
   */
  lastEditedAt?: FieldValue

  
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

  /**
   * Marks whether a comment is deleted.
   */
  isDeleted?: boolean

  /**
   * Marks whether a comment has been removed after moderation.
   */
  isRemoved?: boolean

  /**
   * Result of the hate speech analysis.
   * 
   * @optional
   */
  hateSpeech?: ContentHateSpeechResult
}

/**
 * The `Comment` interface defines the queryable details of a comment on **OpenReply**, excluding the subcollections.
 */
export interface Comment extends Omit<
  _Comment,
  'replies'
> {}

/**
 * The `Reply` interface defines a reply on **OpenReply**.
 */
export interface Reply {
  /**
   * This `id` uniquely identifies a reply, and is generated using UUID V4.
   */
  id: ReplyID

  /**
   * The ID of the reply that this reply might be replying to.
   * 
   * @optional
   */
  secondaryReplyID?: ReplyID

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
   * The domain, not the page, on which the parent comment was posted.\
   * It consists of the subdomain, domain, the TLD, and the port number (if present).
   * 
   * **Example**: `www.example.co.uk:443` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
   */
  domain: string

  /**
   * The full URL (except fragments) on which the parent comment was posted.
   * 
   * **Example**: `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
   */
  URL: string


  /**
   * Contains the plaintext body of the reply.
   */
  body: string
  
  /**
   * The UID of the user that posted the reply.
   */
  author: UID

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
  createdAt: FieldValue

  /**
   * The ID of the activity associated with the reply creation.
   */
  creationActivityID: ActivityID
  
  /**
   * Timestamp for when the reply was last edited.
   */
  lastEditedAt?: FieldValue

  
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

  /**
   * Marks whether a reply is deleted.
   */
  isDeleted?: boolean

  /**
   * Marks whether a reply has been removed after moderation.
   */
  isRemoved?: boolean

  /**
   * Result of the hate speech analysis.
   * 
   * @optional
   */
  hateSpeech: ContentHateSpeechResult
}

export type Topic = keyof typeof TOPICS

/**
 * The result of analysis of a given content (comment, reply, etc.) for hate speech.
 */
export interface ContentHateSpeechResult {
  /**
   * Represents whether or not the content contains hate speech.
   */
  isHateSpeech: boolean

  /**
   * If `isHateSpeech` is true, this is be the reason provided for the analysis result.
   * 
   * @optional
   */
  reason?: string
}

/**
 * An extended variant of `ContentHateSpeechResult`, only generated when active comment moderation is on.
 */
export type ContentHateSpeechResultWithSuggestion = ContentHateSpeechResult & { suggestion?: string }
