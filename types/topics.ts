// Imports:
import type { URLHash } from './websites'
import type { UID } from './user'

// Exports:
export interface FlatTopicComment {
  /**
   * The UID of the user that posted the comment.
   */
  author: UID

  /**
   * The time-dependent Hot Score of the comment, given by:
   * 
   * ```ts
   * const hot = (upvotes: number, downvotes: number, createdOn: number) => {
   *  const s = upvotes - downvotes
   *  const order = Math.log10(Math.max(Math.abs(s), 1))
   *  const sign = s > 0 ? 1 : s < 0 ? -1 : 0
   *  const seconds = createdOn - Date.now()
   * 
   *  return Number((sign * order + seconds / 45000).toFixed(7))
   * }
   * ```
   */
  hotScore: number

  /**
   * The URL Hash of the website that the comment was posted under.
   * 
   * It is present here for routing purposes.
   */
  URLHash: URLHash
}
