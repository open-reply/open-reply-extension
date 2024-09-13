// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { URLHash } from 'types/websites'
import { OrderBy, type WithVote } from 'types/votes'
import type {
  Comment,
  CommentID,
  ContentHateSpeechResultWithSuggestion,
} from 'types/comments-and-replies'
import type { UID } from 'types/user'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

/**
 * Fetches the comments for a website.
 */
export const getComments = async ({
  URLHash,
  limit = 10,
  orderBy = OrderBy.Popular,
  lastVisible = null,
}: {
  URLHash: URLHash
  limit?: number
  orderBy: OrderBy
  lastVisible: QueryDocumentSnapshot<Comment> | null
}): Promise<Returnable<{
  comments: WithVote<Comment>[],
  lastVisible: QueryDocumentSnapshot<Comment> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      comments: WithVote<Comment>[],
      lastVisible: QueryDocumentSnapshot<Comment> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getComments,
          payload: {
            URLHash,
            limit,
            orderBy,
            lastVisible,
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
      functionName: 'getComments',
      data: {
        URLHash,
        limit,
        orderBy,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the comments posted by a user.
 */
export const getUserComments = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<Comment> | null
}): Promise<Returnable<{
  comments: WithVote<Comment>[],
  lastVisible: QueryDocumentSnapshot<Comment> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      comments: WithVote<Comment>[],
      lastVisible: QueryDocumentSnapshot<Comment> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getUserComments,
          payload: {
            UID,
            limit,
            lastVisible,
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
      functionName: 'getUserComments',
      data: {
        UID,
        limit,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the comment snapshot given the commentID and the URLHash from the Firestore Database.
 * 
 * Note that this does not return the vote of the current user. Call `_getCommentVote` separately for that.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getCommentSnapshot = async ({
  commentID,
  URLHash,
}: {
  commentID: CommentID
  URLHash: URLHash
}): Promise<Returnable<DocumentSnapshot<Comment>, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<DocumentSnapshot<Comment>, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getCommentSnapshot,
          payload: {
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
      functionName: 'getCommentSnapshot',
      data: {
        commentID,
        URLHash,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Check if a comment contains hate-speech.
 */
export const checkCommentForHateSpeech = async (comment: string): Promise<Returnable<ContentHateSpeechResultWithSuggestion, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<ContentHateSpeechResultWithSuggestion, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.checkCommentForHateSpeech,
          payload: comment,
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
      functionName: 'checkCommentForHateSpeech',
      data: comment,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
