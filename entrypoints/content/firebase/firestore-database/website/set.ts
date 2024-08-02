// Packages:
import { auth, functions } from '../..'
import { Timestamp } from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { v4 as uuidv4 } from 'uuid'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash, WebsiteFlag, WebsiteFlagReason } from 'types/websites'

// Exports:
/**
 * Flags a website given a URL, URLHash, and a reason.
 */
export const flagWebsite = async (
  {
    URL,
    URLHash,
    reason,
  }: {
    URL: string
    URLHash: URLHash
    reason: WebsiteFlagReason
  }
): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status) throw authCheckResult.payload

    const websiteFlag = {
      flagger: '',
      id: uuidv4(),
      reason,
      flaggedAt: Timestamp.now(),
    } as WebsiteFlag

    const flagWebsite = httpsCallable(functions, 'flagWebsite')

    const response = (await flagWebsite({ URL, URLHash, websiteFlag })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)
    
    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'flagWebsite',
      data: {
        URL,
        URLHash,
        reason,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
