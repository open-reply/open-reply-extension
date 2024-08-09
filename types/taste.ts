// Exports:
/**
 * Keeps a track of the Topic Interest Score, and variables used to generated it
 */
export interface TopicTaste {
  /**
   * The number of upvotes the user has given for this topic.
   * 
   * Note that, if a comment/reply the user upvoted is edited after the fact to something else (implying a new Topic[] for the comment/reply) - then this still remains unchanged, because we're measuring what the user upvoted *at that time*.
   */
  upvotes: number

  /**
   * The number of downvotes the user has given for this topic.
   * 
   * Note that, if a comment/reply the user downvoted is edited after the fact to something else (implying a new Topic[] for the comment/reply) - then this still remains unchanged, because we're measuring what the user downvoted *at that time*.
   */
  downvotes: number

  /**
   * If the user implies that they are not interested in a comment/topic, then this number goes up.
   */
  notInterested: number

  /**
   * The **Topic Taste Score** ∈ [0, 100], generated via the following:
   * 
   * ```ts
   * score = 100 * (1 - e^(-x / TOPIC_MAX_INTERACTIONS_NEEDED_FOR_THIRD_QUARTILE_CONFIDENCE))
   * ```
   * 
   * Where `TOPIC_MAX_INTERACTIONS_NEEDED_FOR_THIRD_QUARTILE_CONFIDENCE` is the maximum number of weighted sum of interactions i.e. `[upvote_weightage, downvote_weightage, not_interested_weightage] * [upvote_count, downvote_count, not_interested_count]^T` needed for a 75% confidence (or Topic Taste Score).
   */
  score: number
}
