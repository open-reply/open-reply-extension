// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types/index'
import type {
  URLHash,
  WebsiteFlagReason,
} from 'types/websites'
import type {
  RealtimeDatabaseWebsite,
  RealtimeDatabaseWebsiteSEO,
} from 'types/realtime.database'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Fetches the website details, given a URLHash, from the Realtime Database.
 */
export const getRDBWebsite = async (URLHash: URLHash): Promise<Returnable<RealtimeDatabaseWebsite | null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<RealtimeDatabaseWebsite | null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsite,
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
      functionName: 'getRDBWebsite',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the website SEO details, given a URLHash, from the Realtime Database.
 */
export const getRDBWebsiteSEO = async (URLHash: URLHash): Promise<Returnable<RealtimeDatabaseWebsiteSEO | null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<RealtimeDatabaseWebsiteSEO | null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteSEO,
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
      functionName: 'getRDBWebsiteSEO',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the website's impression count given a URLHash, from the Realtime Database.
 */
export const getRDBWebsiteImpressions = async (URLHash: URLHash): Promise<Returnable<number, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<number, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteImpressions,
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
      functionName: 'getRDBWebsiteImpressions',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the website's flag distribution given a URLHash, from the Realtime Database.
 */
export const getRDBWebsiteFlagDistribution = async (URLHash: URLHash): Promise<Returnable<Record<WebsiteFlagReason, number>, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<Record<WebsiteFlagReason, number>, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagDistribution,
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
      functionName: 'getRDBWebsiteFlagDistribution',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the website's flag distribution given a URLHash, from the Realtime Database.
 */
export const getRDBWebsiteFlagDistributionReasonCount = async ({
  URLHash,
  reason,
}: {
  URLHash: URLHash
  reason: WebsiteFlagReason
}): Promise<Returnable<number, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<number, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagDistributionReasonCount,
          payload: { URLHash, reason },
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
      functionName: 'getRDBWebsiteFlagDistributionReasonCount',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the website's cumulative weight of all the flags, given a URLHash, from the Realtime Database.
 * 
 * The flag weights are based on the `HARMFUL_WEBSITE_REASON_WEIGHTS` object.
 */
export const getRDBWebsiteFlagsCumulativeWeight = async (URLHash: URLHash): Promise<Returnable<number, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<number, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagsCumulativeWeight,
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
      functionName: 'getRDBWebsiteFlagsCumulativeWeight',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the number of times a website was uniquely flagged, given a URLHash, from the Realtime Database.
 */
export const getRDBWebsiteFlagCount = async (URLHash: URLHash): Promise<Returnable<number, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<number, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagCount,
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
      functionName: 'getRDBWebsiteFlagCount',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the number comment count on a website, given a URLHash, from the Realtime Database.
 */
export const getRDBWebsiteCommentCount = async (URLHash: URLHash): Promise<Returnable<number, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<number, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteCommentCount,
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
      functionName: 'getRDBWebsiteCommentCount',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
