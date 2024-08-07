// Exports:
/**
 * The minimum number of documents that can be present under a topic, at which the feed is stable.
 */
export const STABLE_TOPIC_DOCUMENT_COUNT = 100

/**
 * The maximum number of documents that can be present under a topic, before which it is pruned to `STABLE_TOPIC_DOCUMENT_COUNT`.
 */
export const MAX_TOPIC_DOCUMENT_COUNT = 500
