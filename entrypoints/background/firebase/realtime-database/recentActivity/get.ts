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
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches all the recent activity from a given user.
 * 
 * Useful for building the authenticated user's feed.
 */
export const _getRecentActivityFromUser = async ({
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
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const activitiesRef = ref(database, REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivities(UID))
    let activitiesQuery = query(
      activitiesRef,
      orderByChild('activityAt'),
      limitToLast(limit),
    )

    if (lastActivityID) activitiesQuery = query(activitiesQuery, startAfter(lastActivityID))

    const activitiesSnapshot = await get(activitiesQuery)
    const activities: Activity[] = []

    activitiesSnapshot.forEach(activitySnapshot => {
      const activity = activitySnapshot.val() as Activity
      activities.push(activity)
    })

    return returnable.success({
      activities,
      lastActivityID,
    })
  } catch (error) {
    logError({
      functionName: '_getRecentActivityFromUser',
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
