// Exports:
/**
 * The minimum number of documents that can be present under the `notifications` sub-collection, at which the notifications feature is stable.
 */
export const STABLE_NOTIFICATION_DOCUMENT_COUNT = 50

/**
 * The maximum number of documents that can be present under the `notifications` sub-collection, before which it is pruned to `STABLE_NOTIFICATION_DOCUMENT_COUNT`.
 */
export const MAX_NOTIFICATION_DOCUMENT_COUNT = 100

/**
 * The minimum number of notifications that can be cached locally, at which the notifications feature is stable.
 */
export const STABLE_LOCAL_NOTIFICATION_COUNT = 250

/**
 * The maximum number of notifications that can be cached locally, before which it is pruned to `STABLE_LOCAL_NOTIFICATION_COUNT`.
 */
export const MAX_LOCAL_NOTIFICATION_COUNT = 500
