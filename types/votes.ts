// Imports:
import { type Timestamp } from 'firebase/firestore'
import type { UID } from './user'

// Exports:
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
   * Useful for `ORDER_BY.CONTROVERSIAL` ranking.
   */
  summation: number
  
  /**
   * Difference of both upvotes and downvotes. Computed as `up` - `down`.
   * 
   * Useful for `ORDER_BY.POPULAR` ranking.
   */
  difference: number

  /**
   * The score generated using the Weighted Difference method.
   * 
   * Computed as `difference * (1 + log(sum))`
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
 * The `VotesInfo` interface defines the votes made to any item (website, comment, or reply).
 */
export interface VotesInfo {
  /**
   * Keeps track of the number of upvotes, downvotes, and additional statistics.
   */
  voteCount: VoteCount

  /**
   * The `votes` object tracks all the votes made to the item. It uses the UID as the key, as only one vote can be casted per item per user.
   */
  votes: Record<UID, Vote>
}
