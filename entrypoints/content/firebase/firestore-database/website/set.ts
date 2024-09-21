// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type {
  URLHash,
  WebsiteFlagReason,
} from 'types/websites'
import type { Vote } from 'types/votes'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

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
  URLHash: URLHash
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  favicon?: string
}): Promise<Returnable<null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.indexWebsite,
          payload: {
            URL,
            URLHash,
            title,
            description,
            keywords,
            image,
            favicon,
          },
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
    const { status, payload } = await new Promise<Returnable<null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.flagWebsite,
          payload: {
            URL,
            URLHash,
          },
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

/**
 * Handles both upvoting and rolling back an upvote to a website.
 */
export const upvoteWebsite = async ({
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
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.upvoteWebsite,
          payload: {
            URL,
            URLHash,
            website: {
              title,
              description,
              keywords,
              image,
              favicon,
            }
          },
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
      functionName: 'upvoteWebsite',
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
export const downvoteWebsite = async ({
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
    const { status, payload } = await new Promise<Returnable<Vote | undefined, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.downvoteWebsite,
          payload: {
            URL,
            URLHash,
            website: {
              title,
              description,
              keywords,
              image,
              favicon,
            }
          },
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
      functionName: 'downvoteWebsite',
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
export const bookmarkWebsite = async ({
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
          type: INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.bookmarkWebsite,
          payload: {
            URL,
            URLHash,
          },
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
      functionName: 'bookmarkWebsite',
      data: {
        URL,
        URLHash,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
