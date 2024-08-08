// Imports:
import type { UID } from './user'
import type { ActivityID } from './activity'

// Exports:
export enum OrderBy {
  Oldest = 'Oldest',
  Newest = 'Newest',
  Controversial = 'Controversial',
  Popular = 'Popular',
}

/**
 * The `VoteCount` defines the number of upvotes and downvotes, and provides additional statistics for ordering.
 */
export interface VoteCount {
  /**
   * The total number of upvotes.
   */
  up: number

  /**
   * The total number of downvotes.
   */
  down: number
  
  /**
   * Useful for `OrderBy.Controversial` ranking.
   */
  controversy: number

  /**
   * The score generated using the Wilson Score Interval.
   * 
   * Given by:
   * ```py
   * def _confidence(ups, downs):
   *  n = ups + downs
   *  if n == 0:
   *    return 0
   *  
   *  z = 1.281551565545 # 80% confidence
   *  p = float(ups) / n
   *  
   *  left = p + 1/(2*n)*z*z
   *  right = z*sqrt(p*(1-p)/n + z*z/(4*n*n))
   *  under = 1+1/n*z*z
   *  
   *  return (left - right) / under
   * ```
   */
  wilsonScore: number
}

/**
 * The `VoteType` enum represents the two possible types of vote - upvote and downvote - mapped to 0 and 1.
 */
export enum VoteType {
  Upvote,
  Downvote,
}

/**
 * The `Vote` interface defines one vote.
 */
export interface Vote {
  /**
   * The vote that was casted by the user, either upvote (0) or downvote (1).
   */
  vote: VoteType

  /**
   * The timestamp for when the vote was casted.
   */
  votedOn: number

  /**
   * The ID of the activity associated with the vote.
   */
  activityID: ActivityID
}

/**
* The `Votes` type tracks all the votes made to the item. It uses the UID as the key, as only one vote can be casted per item per user.
*/
export type Votes = Record<UID, Vote>
