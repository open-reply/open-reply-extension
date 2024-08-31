// Packages:
import logError from 'utils/logError'
import returnable from 'utils/returnable'

// Typescript:
import type { Returnable } from 'types'
import type { CommentID } from 'types/comments-and-replies'
import type { URLHash } from 'types/websites'
import type { UID } from 'types/user'
import type { Activity, ActivityID } from 'types/activity'

export interface CommentReference {
  author: UID
  commentID: CommentID
  URLHash: URLHash
}

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches all the recent activity from a given user.
 * 
 * Useful for building the authenticated user's feed.
 */
export const getRecentActivityFromUser = async ({
  UID,
  limit = 10,
  lastActivityID = null,
}: {
  UID: UID
  limit?: number
  lastActivityID: ActivityID | null
}): Promise<Returnable<{
  activities: Activity[]
  lastActivityID: ActivityID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      activities: Activity[]
      lastActivityID: ActivityID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.recentActivity.get.getRecentActivityFromUser,
          payload: {
            UID,
            limit,
            lastActivityID,
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
      functionName: 'getRecentActivityFromUser',
      data: {
        UID,
        limit,
        lastActivityID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
