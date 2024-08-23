// Packages:
import { auth, database } from '../..'
import { get, ref } from 'firebase/database'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'

// Typescript:
import type { Returnable } from 'types'
import type { Topic } from 'types/comments-and-replies'
import type { TopicTaste } from 'types/taste'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Get the topic taste profile for the currently logged in user.
 */
export const getUserTaste = async (): Promise<Returnable<Record<Topic, TopicTaste> | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    return returnable.success(
      (
        await get(
          ref(
            database,
            REALTIME_DATABASE_PATHS.TASTES.topicsTaste(auth.currentUser.uid)
          )
        )
      ).val() as Record<Topic, TopicTaste> | undefined
    )
  } catch (error) {
    logError({
      functionName: 'getUserTaste',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Get the taste score for a particular topic for the currently logged in user.
 */
export const getUserTopicTasteScore = async (topic: Topic): Promise<Returnable<number | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    return returnable.success(
      (
        await get(
          ref(
            database,
            REALTIME_DATABASE_PATHS.TASTES.topicTasteScore(auth.currentUser.uid, topic)
          )
        )
      ).val() as number | undefined
    )
  } catch (error) {
    logError({
      functionName: 'getUserTopicTasteScore',
      data: topic,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
