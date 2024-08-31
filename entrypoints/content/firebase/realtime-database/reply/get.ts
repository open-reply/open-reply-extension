// Packages:
import logError from 'utils/logError'
import returnable from 'utils/returnable'

// Typescript:
import type { Returnable } from 'types'
import type { ReplyID } from 'types/comments-and-replies'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Checks if a reply is bookmarked by the user.
 */
export const isReplyBookmarked = async (replyID: ReplyID): Promise<Returnable<boolean, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<boolean, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.reply.get.isReplyBookmarked,
          payload: replyID,
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
      functionName: 'isReplyBookmarked',
      data: replyID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
