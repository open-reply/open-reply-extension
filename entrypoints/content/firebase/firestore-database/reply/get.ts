// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'
import type {
  CommentID,
  ContentHateSpeechResultWithSuggestion,
  Reply,
  ReplyID,
} from 'types/comments-and-replies'
import type { UID } from 'types/user'
import type { WithVote } from 'types/votes'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches the replies for a comment on a website.
 */
export const getReplies = async ({
  URLHash,
  commentID,
  limit = 10,
  lastVisibleID = null,
  resetPointer,
}: {
  URLHash: URLHash
  commentID: CommentID
  limit?: number
  lastVisibleID: ReplyID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  replies: WithVote<Reply>[],
  lastVisibleID: ReplyID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      replies: WithVote<Reply>[],
      lastVisibleID: ReplyID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getReplies,
          payload: {
            URLHash,
            commentID,
            limit,
            lastVisibleID,
            resetPointer,
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
      functionName: 'getReplies',
      data: {
        URLHash,
        limit,
        lastVisibleID,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the replies posted by a user.
 */
export const getUserReplies = async ({
  UID,
  limit = 10,
  lastVisibleID = null,
  resetPointer,
}: {
  UID: UID
  limit?: number
  lastVisibleID: ReplyID | null
  resetPointer?: boolean
}): Promise<Returnable<{
  replies: WithVote<Reply>[],
  lastVisibleID: ReplyID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      replies: WithVote<Reply>[],
      lastVisibleID: ReplyID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getUserReplies,
          payload: {
            UID,
            limit,
            lastVisibleID,
            resetPointer,
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
      functionName: 'getUserReplies',
      data: {
        UID,
        limit,
        lastVisibleID,
        resetPointer,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the reply given a URLHash from the Firestore Database.
 * 
 * You can get the `URLHash` by using the `utils/getURLHash()` function.
 * 
 * Note that this does not return the vote of the current user. Call `_getReplyVote` separately for that.
 */
export const getReply = async ({
  replyID,
  commentID,
  URLHash,
}: {
  replyID: ReplyID
  commentID: CommentID
  URLHash: URLHash
}): Promise<Returnable<Reply | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Reply | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getReply,
          payload: {
            replyID,
            commentID,
            URLHash,
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
      functionName: 'getReply',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Check if a reply contains hate-speech.
 */
export const checkReplyForHateSpeech = async (reply: string): Promise<Returnable<ContentHateSpeechResultWithSuggestion, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<ContentHateSpeechResultWithSuggestion, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.checkReplyForHateSpeech,
          payload: reply,
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
      functionName: 'checkReplyForHateSpeech',
      data: reply,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
