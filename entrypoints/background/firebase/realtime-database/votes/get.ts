// Packages:
import { auth, database } from '../..'
import { child, get, ref } from 'firebase/database'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import {
  getCachedCommentVotesList,
  getCachedReplyVotesList,
  getCachedWebsiteVotesList,
  setCachedCommentVote,
  setCachedReplyVote,
  setCachedWebsiteVote,
} from '@/entrypoints/background/localforage/votes'
import fetchWith from '@/entrypoints/background/utils/fetchWith'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'

// Typescript:
import { FetchPolicy, type Returnable } from 'types'
import type { Vote } from 'types/votes'
import type { URLHash } from 'types/websites'
import type { UID } from 'types/user'
import type { CommentID, ReplyID } from 'types/comments-and-replies'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Get the current user's vote for a website.
 */
export const _getWebsiteVote = async ({
  URLHash,
  fetchPolicy,
}: {
  URLHash: URLHash
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    if (!fetchPolicy) fetchPolicy = FetchPolicy.NetworkIfCacheExpired
    const response = await fetchWith({
      cacheGetter: async () => {
        const cachedWebsiteVotesList = await getCachedWebsiteVotesList()
        const vote = cachedWebsiteVotesList[URLHash]
        return vote
      },
      networkGetter: async () => {
        const voteSnapshot = await get(child(ref(database), REALTIME_DATABASE_PATHS.VOTES.websiteVote(URLHash, auth.currentUser?.uid as UID)))
        if (voteSnapshot.exists()) return voteSnapshot.val() as Vote
        else return null
      },
      cacheSetter: async vote => await setCachedWebsiteVote(URLHash, vote === null ? undefined : vote),
      fetchPolicy,
    })

    if (!response.status) throw response.payload
    return returnable.success(response.payload === null ? undefined : response.payload)
  } catch (error) {
    logError({
      functionName: '_getWebsiteVote',
      data: {
        URLHash,
        fetchPolicy,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Get the current user's vote for a comment.
 */
export const _getCommentVote = async ({
  commentID,
  fetchPolicy,
}: {
  commentID: CommentID
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    if (!fetchPolicy) fetchPolicy = FetchPolicy.NetworkIfCacheExpired
    const response = await fetchWith({
      cacheGetter: async () => {
        const cachedCommentVotesList = await getCachedCommentVotesList()
        const vote = cachedCommentVotesList[commentID]
        return vote
      },
      networkGetter: async () => {
        const voteSnapshot = await get(child(ref(database), REALTIME_DATABASE_PATHS.VOTES.commentVote(commentID, auth.currentUser?.uid as UID)))
        if (voteSnapshot.exists()) return voteSnapshot.val() as Vote
        else return null
      },
      cacheSetter: async vote => await setCachedCommentVote(commentID, vote === null ? undefined : vote),
      fetchPolicy,
    })

    if (!response.status) throw response.payload
    return returnable.success(response.payload === null ? undefined : response.payload)
  } catch (error) {
    logError({
      functionName: '_getCommentVote',
      data: {
        commentID,
        fetchPolicy,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Get the current user's vote for a reply.
 */
export const _getReplyVote = async ({
  replyID,
  fetchPolicy,
}: {
  replyID: ReplyID
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    if (!fetchPolicy) fetchPolicy = FetchPolicy.NetworkIfCacheExpired
    const response = await fetchWith({
      cacheGetter: async () => {
        const cachedReplyVotesList = await getCachedReplyVotesList()
        const vote = cachedReplyVotesList[replyID]
        return vote
      },
      networkGetter: async () => {
        const voteSnapshot = await get(child(ref(database), REALTIME_DATABASE_PATHS.VOTES.replyVote(replyID, auth.currentUser?.uid as UID)))
        if (voteSnapshot.exists()) return voteSnapshot.val() as Vote
        else return null
      },
      cacheSetter: async vote => await setCachedReplyVote(replyID, vote === null ? undefined : vote),
      fetchPolicy,
    })

    if (!response.status) throw response.payload
    return returnable.success(response.payload === null ? undefined : response.payload)
  } catch (error) {
    logError({
      functionName: '_getReplyVote',
      data: {
        replyID,
        fetchPolicy,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
