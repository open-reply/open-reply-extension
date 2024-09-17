// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'
import type { Comment, CommentID } from 'types/comments-and-replies'
import type { Vote } from 'types/votes'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Add a comment.
 */
export const addComment = async ({
  URL,
  URLHash,
  domain,
  body,
  website: {
    title,
    description,
    keywords,
    image,
    favicon,
  },
}: {
  URL: string
  URLHash: URLHash
  domain: string
  body: string
  website: {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    favicon?: string
  }
}): Promise<Returnable<Comment, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Comment, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.addComment,
          payload: {
            URL,
            URLHash,
            domain,
            body,
            website: {
              title,
              description,
              keywords,
              image,
              favicon,
            },
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
      functionName: 'addComment',
      data: {
        URL,
        URLHash,
        domain,
        body,
        website: {
          title,
          description,
          keywords,
          image,
          favicon,
        },
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Delete a comment.
 */
export const deleteComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.deleteComment,
          payload: {
            URL,
            URLHash,
            commentID,
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
      functionName: 'deleteComment',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Edit a comment.
 */
export const editComment = async ({
  URL,
  URLHash,
  commentID,
  body,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  body: string
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.editComment,
          payload: {
            URL,
            URLHash,
            commentID,
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
      functionName: 'editComment',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Reply a comment.
 */
export const reportComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.reportComment,
          payload: {
            URL,
            URLHash,
            commentID,
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
      functionName: 'reportComment',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Handles both upvoting and rolling back an upvote to a comment.
 */
export const upvoteComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.upvoteComment,
          payload: {
            URL,
            URLHash,
            commentID,
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
      functionName: 'upvoteComment',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Handles both downvoting and rolling back an downvote to a comment.
 */
export const downvoteComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.downvoteComment,
          payload: {
            URL,
            URLHash,
            commentID,
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
      functionName: 'downvoteComment',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Triggered when the user is not interested in the comment itself (and its topics).
 */
export const notInterestedInComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.notInterestedInComment,
          payload: {
            URL,
            URLHash,
            commentID,
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
      functionName: 'notInterestedInComment',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Bookmark a comment.
 */
export const bookmarkComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.bookmarkComment,
          payload: {
            URL,
            URLHash,
            commentID,
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
      functionName: 'bookmarkComment',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
