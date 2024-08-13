// Typescript:
import type { FieldValue } from 'firebase/firestore'
import type { CommentID } from './comments-and-replies'
import type { URLHash } from './websites'

// Exports:
/**
 * Defines the base bookmark interface.
 */
interface Bookmark {
  /**
   * Timestamp for when the comment/reply was bookmarked.
   */
  bookmarkedAt: FieldValue
}

/**
 * Defines a website bookmark.
 */
export interface WebsiteBookmark extends Bookmark {}

/**
 * Defines a comment bookmark.
 */
export interface CommentBookmark extends WebsiteBookmark {
  /**
   * The URL Hash of the website the comment or reply is on.
   */
  URLHash: URLHash
}

/**
 * Defines a reply bookmark.
 */
export interface ReplyBookmark extends CommentBookmark {
  /**
   * The ID of the comment the reply is under.
   */
  commentID: CommentID
}