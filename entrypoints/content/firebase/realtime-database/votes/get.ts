// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable, FetchPolicy } from 'types'
import type { URLHash } from 'types/websites'
import type { Vote } from 'types/votes'
import type { CommentID, ReplyID } from 'types/comments-and-replies'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Get the current user's vote for a website.
 */
export const getWebsiteVote = async ({
  URLHash,
  fetchPolicy,
}: {
  URLHash: URLHash
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.votes.get.getWebsiteVote,
          payload: {
            URLHash,
            fetchPolicy,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getWebsiteVote',
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
export const getCommentVote = async ({
  commentID,
  fetchPolicy,
}: {
  commentID: CommentID
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.votes.get.getCommentVote,
          payload: {
            commentID,
            fetchPolicy,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getCommentVote',
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
export const getReplyVote = async ({
  replyID,
  fetchPolicy,
}: {
  replyID: ReplyID
  fetchPolicy?: FetchPolicy
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.votes.get.getReplyVote,
          payload: {
            replyID,
            fetchPolicy,
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'getReplyVote',
      data: {
        replyID,
        fetchPolicy,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
