// Packages:
import * as functions from 'firebase-functions/v1'
import { database } from './config'
import logError from 'utils/logError'
import returnable from 'utils/returnable'

// Typescript:
import type { FlatTopicComment } from 'types/topics'
import type { RealtimeDatabaseTopic } from 'types/realtime.database'
import type { Topic } from 'types/comments-and-replies'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_TOPIC_COMMENT_COUNT, STABLE_TOPIC_COMMENT_COUNT } from 'constants/database/topics'
import { TOPICS } from 'constants/database/comments-and-replies'

// Exports:
export const pruneTopicComments = functions.pubsub
  .schedule('every monday 00:00') // Runs weekly on Mondays at midnight.
  .timeZone('America/New_York')
  .onRun(async () => {
    try {
      const topics = Object.values(TOPICS)

      for await (const topic of topics) {
        const topicCommentsRef = database.ref(REALTIME_DATABASE_PATHS.TOPICS.topicComments(topic))
        const topicCommentsCount = (await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
          .get()).val() ?? 0
        
        // Prune topic only if there are more comments than `MAX_TOPIC_COMMENT_COUNT`.
        if (topicCommentsCount > MAX_TOPIC_COMMENT_COUNT) {
          const topFlatCommentsSnapshot = await database
            .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScores(topic))
            .orderByChild('hotScore')
            .limitToLast(STABLE_TOPIC_COMMENT_COUNT)
            .get()
          
          const topFlatComments = topFlatCommentsSnapshot.val() as Record<Topic, FlatTopicComment>
          const newTopicCommentsObject: Partial<RealtimeDatabaseTopic['comments']> = {
            scores: topFlatComments,
            count: STABLE_TOPIC_COMMENT_COUNT,
          }

          await topicCommentsRef.set(newTopicCommentsObject)
        }
      }

      return returnable.success(null)
    } catch (error) {
      logError({ data: null, error, functionName: 'pruneTopicComments' })
      return returnable.fail("We're currently facing some problems, please try again later!")
    }
  })
