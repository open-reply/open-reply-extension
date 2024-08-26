// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Increment the website impression count.
 * 
 * The user should be authenticated for this operation. Additionally, impressions should only count if the user spends more than 5 seconds on the page.
 */
export const incrementWebsiteImpression = async ({
  URL,
  URLHash,
}: {
  URL: string
  URLHash: URLHash
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.set.incrementWebsiteImpression,
          payload: URLHash,
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
      functionName: 'incrementWebsiteImpression',
      data: {
        URL,
        URLHash,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
