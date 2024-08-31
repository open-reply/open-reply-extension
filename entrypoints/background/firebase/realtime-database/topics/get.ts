// Packages:
import { auth, database } from '../..'
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  startAfter,
  get,
} from 'firebase/database'
import logError from 'utils/logError'
import returnable from 'utils/returnable'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { getCachedMutedBUsersList } from '@/entrypoints/content/localforage/muted'
import { getCachedCommentVotesList } from '@/entrypoints/content/localforage/votes'

// Typescript:
import type { Returnable } from 'types'
import type { CommentID, Topic } from 'types/comments-and-replies'
import type { FlatTopicComment } from 'types/topics'
import type { URLHash } from 'types/websites'
import type { UID } from 'types/user'

export interface CommentReference {
  author: UID
  commentID: CommentID
  URLHash: URLHash
}

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches all the comment references for a particular topic. The reference object can be used with Firestore's `getCommentSnapshot` to fetch the actual comment.
 * 
 * @param topic The topic to fetch from
 * @param limit The maximum comments to retrieve. Please note that if filters are applies, retrieved comment reference count may be lower than the limit.
 * @param lastCommmentID Pass the last comment ID for pagination.
 * @param filter.alreadyVoted Filter out all the comments that have already been liked by the authenticated user.
 * @param filter.mutedFollowing Filter out all the comments posted by users that the authenticated user has muted.
 * @param useCache.alreadyVoted Uses cached comment votes list for `filter.alreadyVoted`.
 * @param useCache.mutedFollowing Uses cached muted users list for `filter.mutedFollowing`.
 */
export const _getTopicCommentScores = async ({
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
    const commentsRef = ref(database, REALTIME_DATABASE_PATHS.TOPICS.topicCommentScores(topic))
    let commentsQuery = query(
      commentsRef,
      orderByChild('hotScore'),
      limitToLast(limit),
    )

    if (lastCommentID) commentsQuery = query(commentsQuery, startAfter(lastCommentID))

    const commentsSnapshot = await get(commentsQuery)
    const comments: Record<CommentID, FlatTopicComment> = {}

    commentsSnapshot.forEach(commentSnapshot => {
      const flatTopicComment = commentSnapshot.val() as FlatTopicComment
      comments[commentSnapshot.key!] = flatTopicComment
    })

    const commentIDs = Object.keys(comments)
    let commentReferences: CommentReference[] = Object.entries(comments)
      .map(comment => ({
        commentID: comment[0],
        URLHash: comment[1].URLHash,
        author: comment[1].author,
      }))
    const newLastCommentID = commentIDs.length > 0 ? commentIDs[0] : null

    if (filter?.mutedFollowing) {
      const mutedUsersList: UID[] = []
      const authCheckResult = await thoroughAuthCheck(auth.currentUser)
      if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload
      
      if (useCache.mutedFollowing) mutedUsersList.concat(await getCachedMutedBUsersList())
      else {
        const mutedUsersRef = ref(database, REALTIME_DATABASE_PATHS.MUTED.mutedUsers(auth.currentUser.uid))
        const mutedUsersSnapshot = await get(mutedUsersRef)

        mutedUsersSnapshot.forEach((mutedUserSnapshot) => {
          const mutedUID = mutedUserSnapshot.key
          const isMuted = mutedUserSnapshot.val() as boolean

          if (isMuted) mutedUsersList.push(mutedUID)
        })
      }

      commentReferences = commentReferences.filter(commentReference => !mutedUsersList.includes(commentReference.author))
    }

    if (filter?.alreadyVoted) {
      let newCommentReferences: CommentReference[] = []
      const authCheckResult = await thoroughAuthCheck(auth.currentUser)
      if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

      for await (const commentReference of commentReferences) {
        let isAlreadyVotedOn = false
        if (useCache.alreadyVoted) {
          const cachedCommentVotes = await getCachedCommentVotesList()
          isAlreadyVotedOn = !!cachedCommentVotes[commentReference.commentID]
        } else {
          isAlreadyVotedOn = (
            await get(
              ref(
                database,
                REALTIME_DATABASE_PATHS.VOTES.commentVoteType(
                  commentReference.commentID,
                  auth.currentUser.uid,
                ),
              ),
            )
          ).exists()
        }
        if (!isAlreadyVotedOn) newCommentReferences.push(commentReference)
      }

      commentReferences = newCommentReferences
    }

    return returnable.success({
      commentReferences,
      lastCommentID: newLastCommentID,
    })
  } catch (error) {
    logError({
      functionName: '_getTopicCommentScores',
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
