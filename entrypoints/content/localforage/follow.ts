// Packages:
import localforage from 'localforage'

// Typescript:
import type {
  FollowerUser,
  FollowingUser,
  UID,
} from 'types/user'

// Constants:
import { LOCAL_FORAGE_SCHEMA } from '.'

// Exports:
/**
 * Fetch an array of all the followers of the user that have been cached locally.
 */
export const getCachedFollowersList = async (): Promise<UID[]> => {
  const followers = await localforage.getItem<Record<UID, FollowerUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWERS) ?? {}
  return Object.keys(followers)
}

/**
 * Fetch all the followers of the user that have been cached locally.
 */
export const getCachedFollowers = async (): Promise<Record<UID, FollowerUser>> => {
  const followers = await localforage.getItem<Record<UID, FollowerUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWERS) ?? {}
  return followers
}

/**
 * Add a user to the locally cached followers list.
 */
export const addCachedFollower = async (UID: UID, user: FollowerUser) => {
  const followers = await localforage.getItem<Record<UID, FollowerUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWERS) ?? {}
  followers[UID] = user
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWERS, followers)
}

/**
 * Remove a user from the locally cached followers list.
 */
export const removeCachedFollower = async (UID: UID) => {
  const followers = await localforage.getItem<Record<UID, FollowerUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWERS) ?? {}
  delete followers[UID]
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWERS, followers)
}


/**
 * Fetch an array of all the users that the authenticated user follows that have been cached locally.
 */
export const getCachedFollowingList = async (): Promise<UID[]> => {
  const following = await localforage.getItem<Record<UID, FollowingUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWING) ?? {}
  return Object.keys(following)
}

/**
 * Fetch all the users that the authenticated user follows that have been cached locally.
 */
export const getCachedFollowing = async (): Promise<Record<UID, FollowingUser>> => {
  const following = await localforage.getItem<Record<UID, FollowingUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWERS) ?? {}
  return following
}

/**
 * Add a user to the locally cached following list.
 */
export const addCachedFollowing = async (UID: UID, user: FollowingUser) => {
  const following = await localforage.getItem<Record<UID, FollowingUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWING) ?? {}
  following[UID] = user
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWING, following)
}

/**
 * Remove a user from the locally cached following list.
 */
export const removeCachedFollowing = async (UID: UID) => {
  const following = await localforage.getItem<Record<UID, FollowingUser>>(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWING) ?? {}
  delete following[UID]
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.FOLLOW.FOLLOWING, following)
}
