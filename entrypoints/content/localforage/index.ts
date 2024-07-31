// Packages:
import { AVERAGE_MONTH } from 'time-constants'

// Exports:
export type Local<T> = T & { _lastUpdatedLocally?: number }

export const LOCAL_FORAGE_SCHEMA = {
  USERS: 'users',
}

export const USER_CACHE_EXPIRY = 30 * AVERAGE_MONTH
