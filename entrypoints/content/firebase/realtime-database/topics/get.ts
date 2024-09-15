// Packages:
import logError from 'utils/logError'
import returnable from 'utils/returnable'

// Typescript:
import type { Returnable } from 'types'
import type { CommentID, Topic } from 'types/comments-and-replies'
import type { URLHash } from 'types/websites'
import type { UID } from 'types/user'

export interface CommentReference {
  author: UID
  commentID: CommentID
  URLHash: URLHash
}

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches all the comment references for a particular topic. The reference object can be used with Firestore's `getComment` to fetch the actual comment.
 * 
 * @param topic The topic to fetch from
 * @param limit The maximum comments to retrieve. Please note that if filters are applies, retrieved comment reference count may be lower than the limit.
 * @param lastCommmentID Pass the last comment ID for pagination.
 * @param filter.alreadyVoted Filter out all the comments that have already been liked by the authenticated user.
 * @param filter.mutedFollowing Filter out all the comments posted by users that the authenticated user has muted.
 * @param useCache.alreadyVoted Uses cached comment votes list for `filter.alreadyVoted`.
 * @param useCache.mutedFollowing Uses cached muted users list for `filter.mutedFollowing`.
 */
export const getTopicCommentScores = async ({
  topic,
  limit = 10,
  lastCommentID = null,
  filter,
  useCache = {
    alreadyVoted: true,
    mutedFollowing: true,
  }
}: {
  topic: Topic
  limit?: number
  lastCommentID: CommentID | null
  filter?: {
    alreadyVoted?: boolean
    mutedFollowing?: boolean
  }
  useCache?: {
    alreadyVoted?: boolean
    mutedFollowing?: boolean
  }
}): Promise<Returnable<{
  commentReferences: CommentReference[]
  lastCommentID: CommentID | null
}, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<{
      commentReferences: CommentReference[]
      lastCommentID: CommentID | null
    }, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.topics.get.getTopicCommentScores,
          payload: {
            topic,
            limit,
            lastCommentID,
            filter,
            useCache,
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
      functionName: 'getTopicCommentScores',
      data: {
        topic,
        limit,
        lastCommentID,
        filter,
        useCache,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
