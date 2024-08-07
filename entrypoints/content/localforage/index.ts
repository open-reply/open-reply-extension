// Packages:
import { AVERAGE_MONTH } from 'time-constants'

// Exports:
export type Local<T> = T & { _lastUpdatedLocally?: number }

export const LOCAL_FORAGE_SCHEMA = {
  USERS: 'users',
  MUTED: 'muted',
  VOTES: {
    WEBSITES: 'website-votes',
    COMMENTS: 'comment-votes',
    REPLIES: 'reply-votes',
  },
  FOLLOW: {
    FOLLOWERS: 'followers',
    FOLLOWING: 'following',
  },
}

export const USER_CACHE_EXPIRY = 30 * AVERAGE_MONTH
