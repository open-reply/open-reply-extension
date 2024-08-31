// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types'
import type { Topic } from 'types/comments-and-replies'
import type { TopicTaste } from 'types/taste'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Get the topic taste profile for the currently logged in user.
 */
export const getUserTaste = async (): Promise<Returnable<Record<Topic, TopicTaste> | undefined, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Record<Topic, TopicTaste> | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.tastes.get.getUserTaste,
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
    const { status, payload } = await new Promise<Returnable<number | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.tastes.get.getUserTopicTasteScore,
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
      functionName: 'getUserTopicTasteScore',
      data: topic,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
