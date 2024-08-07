// Packages:
import localforage from 'localforage'

// Typescript:
import type { URLHash } from 'types/websites'
import type { Vote } from 'types/votes'
import type { CommentID, ReplyID } from 'types/comments-and-replies'

// Constants:
import { LOCAL_FORAGE_SCHEMA } from '.'

// Exports:
/**
 * Fetch all the websites the user has voted on that have been cached locally.
 */
export const getCachedWebsiteVotesList = async (): Promise<Record<URLHash, Vote>> => {
  const websites = await localforage.getItem<Record<URLHash, Vote>>(LOCAL_FORAGE_SCHEMA.VOTES.WEBSITES) ?? {}
  return websites
}

/**
 * Add a website vote to the locally cached website votes.
 */
export const addCachedWebsiteVote = async (URLHash: URLHash, vote: Vote) => {
  const websites = await getCachedWebsiteVotesList()
  websites[URLHash] = vote
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.VOTES.WEBSITES, websites)
}

/**
 * Remove a website vote from the locally cached website votes list.
 */
export const removeCachedWebsiteVote = async (URLHash: URLHash) => {
  const websites = await getCachedWebsiteVotesList()
  delete websites[URLHash]
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.VOTES.WEBSITES, websites)
}


/**
 * Fetch all the comments the user has voted on that have been cached locally.
 */
export const getCachedCommentVotesList = async (): Promise<Record<CommentID, Vote>> => {
  const comments = await localforage.getItem<Record<CommentID, Vote>>(LOCAL_FORAGE_SCHEMA.VOTES.COMMENTS) ?? {}
  return comments
}

/**
 * Add a comment vote to the locally cached comment votes.
 */
export const addCachedCommentVote = async (commentID: CommentID, vote: Vote) => {
  const comments = await getCachedCommentVotesList()
  comments[commentID] = vote
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.VOTES.COMMENTS, comments)
}

/**
 * Remove a comment vote from the locally cached comment votes list.
 */
export const removeCachedCommentVote = async (commentID: CommentID) => {
  const comments = await getCachedCommentVotesList()
  delete comments[commentID]
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.VOTES.COMMENTS, comments)
}


/**
 * Fetch all the replies the user has voted on that have been cached locally.
 */
export const getCachedReplyVotesList = async (): Promise<Record<ReplyID, Vote>> => {
  const replies = await localforage.getItem<Record<ReplyID, Vote>>(LOCAL_FORAGE_SCHEMA.VOTES.REPLIES) ?? {}
  return replies
}

/**
 * Add a reply vote to the locally cached reply votes.
 */
export const addCachedReplyVote = async (replyID: ReplyID, vote: Vote) => {
  const replies = await getCachedReplyVotesList()
  replies[replyID] = vote
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.VOTES.REPLIES, replies)
}

/**
 * Remove a reply vote from the locally cached reply votes list.
 */
export const removeCachedReplyVote = async (replyID: ReplyID) => {
  const replies = await getCachedReplyVotesList()
  delete replies[replyID]
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.VOTES.REPLIES, replies)
}
