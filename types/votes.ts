// Imports:
import { type Timestamp } from 'firebase/firestore'
import type { UID } from './user'

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
   * Summation of both upvotes and downvotes. Computed as `up` + `down`.
   * 
   * Useful for `OrderBy.Controversial` ranking.
   */
  summation: number

  /**
   * The score generated using the Weighted Difference method.
   * 
   * Computed as `(U - D) * (1 + Math.log(U + D))`
   * 
   * Useful for `OrderBy.Popular` ranking.
   */
  score: number
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
  votedOn: Timestamp
}

/**
* The `Votes` type tracks all the votes made to the item. It uses the UID as the key, as only one vote can be casted per item per user.
*/
export type Votes = Record<UID, Vote>
