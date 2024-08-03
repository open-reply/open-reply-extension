// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'

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
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const incrementWebsiteImpression = httpsCallable(functions, 'incrementWebsiteImpression')

    const response = (await incrementWebsiteImpression({
      URL,
      URLHash,
    })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'incrementWebsiteImpression',
      data: {
        URL,
        URLHash
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
