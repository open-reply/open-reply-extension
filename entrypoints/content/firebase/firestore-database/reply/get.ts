// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { URLHash } from 'types/websites'
import type {
  CommentID,
  ContentHateSpeechResultWithSuggestion,
  Reply,
  ReplyID,
} from 'types/comments-and-replies'
import type { UID } from 'types/user'

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
  lastVisible = null,
}: {
  URLHash: URLHash
  commentID: CommentID
  limit?: number
  lastVisible: QueryDocumentSnapshot<Reply> | null
}): Promise<Returnable<{
  replies: Reply[],
  lastVisible: QueryDocumentSnapshot<Reply> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      replies: Reply[],
      lastVisible: QueryDocumentSnapshot<Reply> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getReplies,
          payload: {
            URLHash,
            commentID,
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
      functionName: 'getComments',
      data: {
        URLHash,
        limit,
        lastVisible,
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
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<Reply> | null
}): Promise<Returnable<{
  replies: Reply[],
  lastVisible: QueryDocumentSnapshot<Reply> | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      replies: Reply[],
      lastVisible: QueryDocumentSnapshot<Reply> | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getUserReplies,
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
      functionName: 'getUserReplies',
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
 * Fetches the reply snapshot given a URLHash from the Firestore Database.
 * 
 * You can get the `URLHash` by using the `utils/getURLHash()` function.
 * 
 * It is more useful than fetching the data itself, since you may want to check if the data exists, using `snapshot.exists()`.\
 * To get the value, simply use `snapshot.data()`.
 */
export const getReplySnapshot = async ({
  replyID,
  commentID,
  URLHash,
}: {
  replyID: ReplyID
  commentID: CommentID
  URLHash: URLHash
}): Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<DocumentSnapshot<FirestoreDatabaseWebsite>, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getReplySnapshot,
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
      functionName: 'getReplySnapshot',
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
