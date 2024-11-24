// Exports:
/**
 * The minimum number of documents that can be present under a topic, at which the feed is stable.
 */
export const STABLE_TOPIC_COMMENT_COUNT = 100

/**
 * The maximum number of documents that can be present under a topic, before which it is pruned to `STABLE_TOPIC_COMMENT_COUNT`.
 */
export const MAX_TOPIC_COMMENT_COUNT = 500

/**
 * The maximum number of comments required to enable the "talks about" section of a user.
 */
export const TALKS_ABOUT_THRESHOLD = 10
