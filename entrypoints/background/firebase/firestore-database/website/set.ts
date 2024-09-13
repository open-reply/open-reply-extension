// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import { setCachedWebsiteVote } from '@/entrypoints/background/localforage/votes'

// Typescript:
import type { Returnable } from 'types/index'
import type {
  URLHash,
  WebsiteFlag,
  WebsiteFlagReason,
} from 'types/websites'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { Vote } from 'types/votes'

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
export const _indexWebsite = async ({
  URL,
  URLHash,
  title,
  description,
  keywords,
  image,
  favicon,
}: {
  URL: string
  URLHash: URLHash
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
    } as FirestoreDatabaseWebsite

    const indexWebsite = httpsCallable(functions, 'indexWebsite')

    const response = (await indexWebsite({ website, URLHash })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)
    
    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_indexWebsite',
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
export const _flagWebsite = async (
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
      reason,
    } as WebsiteFlag

    const flagWebsite = httpsCallable(functions, 'flagWebsite')

    const response = (await flagWebsite({ URL, URLHash, websiteFlag })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)
    
    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_flagWebsite',
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

/**
 * Handles both upvoting and rolling back an upvote to a website.
 */
export const _upvoteWebsite = async ({
  URL,
  URLHash,
  website: {
    title,
    description,
    keywords,
    image,
    favicon,
  },
}: {
  URL: string
  URLHash: URLHash
  website: {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    favicon?: string
  }
}): Promise<Returnable<Vote | undefined, Error>> => {
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
    } as FirestoreDatabaseWebsite

    const upvoteWebsite = httpsCallable(functions, 'upvoteWebsite')

    const response = (await upvoteWebsite({ URL, URLHash, website })).data as Returnable<Vote | undefined, string>
    if (!response.status) throw new Error(response.payload)
    
    await setCachedWebsiteVote(URLHash, response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_upvoteWebsite',
      data: {
        URL,
        URLHash,
        website: {
          title,
          description,
          keywords,
          image,
          favicon,
        },
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Handles both downvoting and rolling back an downvote to a website.
 */
export const _downvoteWebsite = async ({
  URL,
  URLHash,
  website: {
    title,
    description,
    keywords,
    image,
    favicon,
  },
}: {
  URL: string
  URLHash: URLHash
  website: {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    favicon?: string
  }
}): Promise<Returnable<Vote | undefined, Error>> => {
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
    } as FirestoreDatabaseWebsite

    const downvoteWebsite = httpsCallable(functions, 'downvoteWebsite')

    const response = (await downvoteWebsite({ URL, URLHash, website })).data as Returnable<Vote | undefined, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedWebsiteVote(URLHash, response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_downvoteWebsite',
      data: {
        URL,
        URLHash,
        website: {
          title,
          description,
          keywords,
          image,
          favicon,
        },
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Bookmark a website.
 */
export const _bookmarkWebsite = async ({
  URL,
  URLHash,
}: {
  URL: string
  URLHash: URLHash
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const bookmarkWebsite = httpsCallable(functions, 'bookmarkWebsite')

    const response = (await bookmarkWebsite({ URL, URLHash })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_bookmarkWebsite',
      data: {
        URL,
        URLHash,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
