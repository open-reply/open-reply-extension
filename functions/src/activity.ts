// Packages:
import * as functions from 'firebase-functions/v1'
import { database } from './config'
import logError from 'utils/logError'
import returnable from 'utils/returnable'

// Typescript:
import type { UID } from 'types/user'
import type { Activity, ActivityID } from 'types/activity'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_RECENT_USER_ACTIVITY_COUNT, STABLE_RECENT_USER_ACTIVITY_COUNT } from 'constants/database/activity'
const ACTIVITY_PRUNING_BATCH_SIZE = 100

// Exports:
export const pruneRecentActivities = functions.pubsub
  .schedule('every monday 00:00') // Runs weekly on Mondays at midnight.
  .timeZone('America/New_York')
  .onRun(async () => {
    try {
      let lastRecentActivityCount: number | null = null

      while (true) {
        const recentUserActivitiesToPruneQuery = database
          .ref('recentActivityCount')
          .orderByValue()
          .startAt(lastRecentActivityCount === null ? MAX_RECENT_USER_ACTIVITY_COUNT + 1 : lastRecentActivityCount)
          .limitToFirst(ACTIVITY_PRUNING_BATCH_SIZE)
        
        const recentUserActivitiesToPruneSnapshot = await recentUserActivitiesToPruneQuery.get()

        if (!recentUserActivitiesToPruneSnapshot.hasChildren()) {
          console.log('No more users with overflowing recent activities! Exiting pruneRecentActivities..')
          break
        }

        const recentUserActivitiesToPruneObject = recentUserActivitiesToPruneSnapshot.val() as Record<UID, number>
        const recentUserActivitiesToPrune = Object.keys(recentUserActivitiesToPruneObject)

        // Prune activities for UID
        for await (const UID of recentUserActivitiesToPrune) {
          const mostRecentActivitiesSnapshot = await database
            .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivities(UID))
            .orderByChild('activityAt')
            .limitToFirst(STABLE_RECENT_USER_ACTIVITY_COUNT)
            .get()

          const mostRecentActivities = mostRecentActivitiesSnapshot.val() as Record<ActivityID, Activity>

          await database.ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivities(UID)).set(mostRecentActivities)
          await database.ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID)).set(STABLE_RECENT_USER_ACTIVITY_COUNT)
        }
        
        const lastUID = recentUserActivitiesToPrune[recentUserActivitiesToPrune.length - 1]
        lastRecentActivityCount = recentUserActivitiesToPruneObject[lastUID]
      }

      return returnable.success(null)
    } catch (error) {
      logError({ data: null, error, functionName: 'pruneRecentActivities' })
      return returnable.fail("We're currently facing some problems, please try again later!")
    }
  })
