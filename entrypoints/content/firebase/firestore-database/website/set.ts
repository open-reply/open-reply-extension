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
import type {
  URLHash,
  WebsiteFlag,
  WebsiteFlagReason,
} from 'types/websites'
import { FirestoreDatabaseWebsite } from 'types/firestore.database'

// Exports:
/**
 * Index a website.
 * 
 * - **URL**: The full URL (except fragments) on which the comment was posted. **Example**: `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
 * - **URLHash**: The URLHash is a SHA512 hash of a URL (except fragments). It is the unique id for websites. It can be generated using the getURLHash function in utils/getURLHash.
 * - **title**: The title of the website. Can be accessed via `document.title`, `document.querySelector('meta[property="og:title"]').content`, or `document.querySelector('meta[name="twitter:title"]').content`.
 * - **description**: The description of the website. Can be accessed via `document.querySelector('meta[property="og:description"]').content` or `document.querySelector('meta[name="twitter:description"]').content`.
 * - **keywords**: The SEO keywords of the website. Can be accessed via `document.querySelector('meta[name="keywords"]').content`.
 * - **image**: The SEO image card of the website. Can be accessed via `document.querySelector('meta[property="og:image"]').content` or `document.querySelector('meta[name="twitter:image"]').content`.
 */
export const indexWebsite = async ({
  URL,
  URLHash,
  title,
  description,
  keywords,
  image,
  favicon,
}: {
  URL: string
  URLHash: string,
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  favicon?: string
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const website = {
      indexor: auth.currentUser.uid,
      URL,
      title,
      description,
      keywords,
      image,
      favicon,
      indexedOn: Timestamp.now(),
    } as FirestoreDatabaseWebsite

    const indexWebsite = httpsCallable(functions, 'indexWebsite')

    const response = (await indexWebsite({ website, URLHash })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)
    
    return returnable.success(null)
  } catch (error) {
      logError({
        functionName: 'indexWebsite',
        data: {
          URL,
          URLHash,
          title,
          description,
          keywords,
          image,
          favicon,
        },
        error,
      })
  
      return returnable.fail(error as unknown as Error)
    }
}

/**
 * Flags a website.
 * 
 * - **URL**: The full URL (except fragments) on which the comment was posted. **Example**: `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en` of `https://www.example.co.uk:443/blog/article/search?docid=720&hl=en#dayone`
 * - **URLHash**: The URLHash is a SHA512 hash of a URL (except fragments). It is the unique id for websites. It can be generated using the getURLHash function in utils/getURLHash.
 * - **reason**: The reason behind flagging the website.
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
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const websiteFlag = {
      flagger: auth.currentUser.uid,
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
