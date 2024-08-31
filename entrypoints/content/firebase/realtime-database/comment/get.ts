// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types'
import type { CommentID } from 'types/comments-and-replies'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Checks if a comment is bookmarked by the user.
 */
export const isCommentBookmarked = async (commentID: CommentID): Promise<Returnable<boolean, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<boolean, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.comment.get.isCommentBookmarked,
          payload: commentID,
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
      functionName: 'isCommentBookmarked',
      data: commentID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
