// Typescript:
import type { FieldValue } from 'firebase/firestore'
import type { CommentID, ReplyID } from './comments-and-replies'
import type { URLHash } from './websites'

// Exports:
/**
 * Defines the Bookmark ID, only useful for development.
 */
export type BookmarkID = string

/**
 * Defines a bookmark.
 */
export interface Bookmark {
  /**
   * The ID of the bookmark.
   */
  id: BookmarkID

  /**
   * The URL Hash of the website the comment or reply is on.
   */
  URLHash: URLHash

  /**
   * The ID of the comment that is being bookmarked, or the comment whose reply is being bookmarked.
   */
  commentID: CommentID

  /**
   * If the reply is being bookmarked, then this is the ID.
   * 
   * @optional
   */
  replyID?: ReplyID

  /**
   * Timestamp for when the comment/reply was bookmarked.
   */
  bookmarkedAt: FieldValue
}
