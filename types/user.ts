// Imports:
import { FieldValue } from 'firebase/firestore'
import type { Comment, Reply, Report, ReportConclusion } from './comments-and-replies'

// Exports:
/**
 * The UID uniquely identifies a user on the **OpenReply** platform.
 * 
 * It is generated by Firebase Authentication.
 */
export type UID = string

/**
 * The `FlatComment` interface is a partial copy of the `Comment` interface.
 * 
 * Its main purpose is to act the directions to find the actual item.
 */
export interface FlatComment extends Pick<Comment, 'id' | 'URLHash' | 'URL' | 'domain' | 'createdAt'> {}

/**
 * The `FlatReply` interface is a partial copy of the `Reply` interface.
 * 
 * Its main purpose is to act the directions to find the actual item.
 */
export interface FlatReply extends Pick<Reply, 'id' | 'commentID' | 'secondaryReplyID' | 'URLHash' | 'URL' | 'domain' | 'createdAt'> {}

/**
 * The `FlatReport` interface is a partial copy of the `Report` interface.
 * 
 * Its main purpose is to keep a track of the reports filed by the user.
 */
export interface FlatReport extends Pick<Report, 'id' | 'reportedAt' | 'reason' | 'URLHash' | 'commentID' | 'replyID'> {
  /**
   * The conclusion of the report after review.
   * 
   * @optional
   */
  conclusion?: ReportConclusion

  /**
   * The reason behind the conclusion of the review.
   * 
   * @optional
   */
  conclusionReason?: string
}

/**
 * The `FollowerUser` interface defines a user that is following the primary user.
 */
export interface FollowerUser {
  /**
   * The user's UID.
   */
  UID: UID

  /**
   * Timestamp for when this user started following the primary user.
   */
  followedAt: FieldValue
}

/**
 * The `FollowingUser` interface defines a user that is being followed by the primary user.
 */
export interface FollowingUser {
  /**
   * The user's UID.
   */
  UID: UID

  /**
   * Timestamp for when the primary user starting following this user.
   */
  followedAt: FieldValue
}

/**
 * Tracks user verification status.
 */
export interface RealtimeUserVerificationStatus {
  /**
   * Marks user as verified or not.
   */
  isVerified?: string

  /**
   * The timestamp representing the expiry of the verification.
   */
  verifiedTill?: number
}
