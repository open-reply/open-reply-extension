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
 * Set website vote to the locally cached website votes. Passing in undefined removes the vote.
 */
export const setCachedWebsiteVote = async (URLHash: URLHash, vote?: Vote) => {
  const websites = await getCachedWebsiteVotesList()
  if (vote) websites[URLHash] = vote
  else delete websites[URLHash]
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
 * Set comment vote to the locally cached comment votes. Passing in undefined removes the vote.
 */
export const setCachedCommentVote = async (commentID: CommentID, vote?: Vote) => {
  const comments = await getCachedCommentVotesList()
  if (vote) comments[commentID] = vote
  else delete comments[commentID]
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
 * Set reply vote to the locally cached reply votes. Passing in undefined removes the vote.
 */
export const setCachedReplyVote = async (replyID: ReplyID, vote?: Vote) => {
  const replies = await getCachedReplyVotesList()
  if (vote) replies[replyID] = vote
  else delete replies[replyID]
  await localforage.setItem(LOCAL_FORAGE_SCHEMA.VOTES.REPLIES, replies)
}
