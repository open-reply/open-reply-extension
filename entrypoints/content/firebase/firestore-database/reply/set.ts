// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'
import type { CommentID, Reply, ReplyID } from 'types/comments-and-replies'
import type { Vote } from 'types/votes'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Add a reply to a comment.
 */
export const addReply = async ({
  URL,
  URLHash,
  commentID,
  secondaryReplyID,
  domain,
  body,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  secondaryReplyID?: ReplyID
  domain: string
  body: string
}): Promise<Returnable<Reply, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Reply, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.addReply,
          payload: {
            URL,
            URLHash,
            commentID,
            secondaryReplyID,
            domain,
            body,
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
      functionName: 'addReply',
      data: {
        URL,
        URLHash,
        commentID,
        secondaryReplyID,
        domain,
        body,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Delete a reply.
 */
export const deleteReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.deleteReply,
          payload: {
            URL,
            URLHash,
            commentID,
            replyID,
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
      functionName: 'deleteReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Edit a reply.
 */
export const editReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
  body,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
  body: string
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.editReply,
          payload: {
            URL,
            URLHash,
            commentID,
            replyID,
            body,
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
      functionName: 'editReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
        body,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Report a reply.
 */
export const reportReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
  reason,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
  reason: string
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.reportReply,
          payload: {
            URL,
            URLHash,
            commentID,
            replyID,
            reason,
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
      functionName: 'reportReply',
      data: {
        URL,
        URLHash,
        commentID,
        reason,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Handles both upvoting and rolling back an upvote to a reply.
 */
export const upvoteReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.upvoteReply,
          payload: {
            URL,
            URLHash,
            commentID,
            replyID,
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
      functionName: 'upvoteReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Handles both downvoting and rolling back an downvote to a reply.
 */
export const downvoteReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.downvoteReply,
          payload: {
            URL,
            URLHash,
            commentID,
            replyID,
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
      functionName: 'downvoteReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Bookmark a reply.
 */
export const bookmarkReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.bookmarkReply,
          payload: {
            URL,
            URLHash,
            commentID,
            replyID,
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
      functionName: 'bookmarkReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
