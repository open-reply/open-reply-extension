// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'
import getURLHash from 'utils/getURLHash'
import {
  calculateWebsiteBaseRiskScore,
  calculateTemporalWebsiteRiskScore,
  shouldChurnWebsiteFlagInfo,
} from 'utils/websiteFlagInfo'
import { ServerValue } from 'firebase-admin/database'
import { isEmpty, omitBy } from 'lodash'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type { URLHash, WebsiteCategory, WebsiteFlag } from 'types/websites'
import type { RealtimeDatabaseWebsite } from 'types/realtime.database'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'

// Constants:
import { HARMFUL_WEBSITE_REASON_WEIGHTS } from 'constants/database/websites'
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Index a website.
 * 
 * Use `bypassAuthCheck` when calling the function internally inside another function.
 */
export const indexWebsite = async (
  data: {
    website: FirestoreDatabaseWebsite
    URLHash: URLHash
  },
  context: CallableContext,
  bypassAuthCheck?: boolean,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!bypassAuthCheck) {
      if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')
    
      const user = await auth.getUser(UID)
      const name = user.displayName
      const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
      const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
      if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)
  
      if (await getURLHash(data.website.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')
    }
    
    // Store the website details in Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .create(omitBy<FirestoreDatabaseWebsite>(data.website, isEmpty) as Partial<FirestoreDatabaseWebsite>)
    
    // We increment the impression here so that from now onwards, the impressions are tracked.
    await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.impressions(data.URLHash))
      .update(ServerValue.increment(1))

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'indexWebsite' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Flags a website given a URL, URLHash, and a `WebsiteFlag`.
 */
export const flagWebsite = async (data: {
  URL: string
  URLHash: URLHash
  websiteFlag: WebsiteFlag
}, context: CallableContext): Promise<Returnable<null, string>> => {
  try {
    const { URL, URLHash, websiteFlag } = data
    
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(URL) !== URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')
    
    // Save the flag details to Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.FLAGS.INDEX).doc(UID)
      .create(websiteFlag)

    const websiteRef = database.ref(REALTIME_DATABASE_PATHS.WEBSITES.website(URLHash))
    await websiteRef.transaction((realtimeDatabaseWebsite?: RealtimeDatabaseWebsite) => {
      const impressions = realtimeDatabaseWebsite?.impressions
      const flagsCumulativeWeight = realtimeDatabaseWebsite?.flagInfo?.flagsCumulativeWeight
      const flagCount = realtimeDatabaseWebsite?.flagInfo?.flagCount
      const firstFlagTimestamp = realtimeDatabaseWebsite?.flagInfo?.firstFlagTimestamp
      const impressionsSinceLastFlag = realtimeDatabaseWebsite?.flagInfo?.impressionsSinceLastFlag
      const lastFlagTimestamp = realtimeDatabaseWebsite?.flagInfo?.lastFlagTimestamp
      const weight = HARMFUL_WEBSITE_REASON_WEIGHTS[websiteFlag.reason]

      let shouldChurn = false

      if (
        realtimeDatabaseWebsite &&
        impressions !== undefined &&
        flagsCumulativeWeight !== undefined &&
        flagCount !== undefined &&
        firstFlagTimestamp !== undefined &&
        impressionsSinceLastFlag !== undefined &&
        lastFlagTimestamp !== undefined
      ) {
        const baseRiskScore = calculateWebsiteBaseRiskScore({
          flagCount,
          flagsCumulativeWeight,
          impressions
        })

        const temporalRiskScore = calculateTemporalWebsiteRiskScore({
          baseRiskScore,
          currentTimestamp: Date.now(),
          firstFlagTimestamp,
          flagCount,
          impressionsSinceLastFlag,
          lastFlagTimestamp,
        })

        shouldChurn = shouldChurnWebsiteFlagInfo({
          currentTimestamp: Date.now(),
          lastFlagTimestamp,
          temporalRiskScore,
        })
      }

      return {
        ...realtimeDatabaseWebsite,
        flagInfo: {
          ...realtimeDatabaseWebsite?.flagInfo,
          firstFlagTimestamp: shouldChurn ? ServerValue.TIMESTAMP : realtimeDatabaseWebsite?.flagInfo?.firstFlagTimestamp,
          impressionsSinceLastFlag: 0,
          lastFlagTimestamp: ServerValue.TIMESTAMP,
          flagCount: shouldChurn ? 1 : ServerValue.increment(1),
          flagDistribution: shouldChurn ? {} : {
            ...realtimeDatabaseWebsite?.flagInfo?.flagDistribution,
            [websiteFlag.reason]: ServerValue.increment(1),
          },
          flagsCumulativeWeight: shouldChurn ? 0 : ServerValue.increment(weight),
        },
      } as RealtimeDatabaseWebsite
    })

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'flagWebsite' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Increment the website impression count.
 */
export const incrementWebsiteImpression = async (data: {
  URL: string
  URLHash: URLHash
}, context: CallableContext): Promise<Returnable<null, string>> => {
  try {
    const { URL, URLHash } = data
    
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    // Check if the website is indexed before doing any operations.
    const isWebsiteIndexed = (await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.impressions(URLHash)).get()).exists()
    if (!isWebsiteIndexed) return returnable.success(null)
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(URL) !== URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Only the websites that are indexed can track impressions.
    const websiteRef = database.ref(REALTIME_DATABASE_PATHS.WEBSITES.website(URLHash))
    await websiteRef.transaction((realtimeDatabaseWebsite?: RealtimeDatabaseWebsite) => {
      if (!realtimeDatabaseWebsite) return undefined as RealtimeDatabaseWebsite | undefined
      if (!realtimeDatabaseWebsite.impressions) return { ...realtimeDatabaseWebsite, impressions: undefined } as RealtimeDatabaseWebsite | undefined

      if (realtimeDatabaseWebsite.impressions) {
        const hasBeenFlaggedBefore = !!realtimeDatabaseWebsite.flagInfo && !!realtimeDatabaseWebsite.flagInfo.flagCount

        return hasBeenFlaggedBefore ? ({
          ...realtimeDatabaseWebsite,
          impressions: ServerValue.increment(1),
          flagInfo: {
            ...realtimeDatabaseWebsite.flagInfo,
            impressionsSinceLastFlag: ServerValue.increment(1),
          }
        } as RealtimeDatabaseWebsite) : ({
          ...realtimeDatabaseWebsite,
          impressions: ServerValue.increment(1),
        } as RealtimeDatabaseWebsite)
      }
      else return undefined
    })

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'incrementWebsiteImpression' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Set the website category.
 */
export const setWebsiteCategory = async (data: {
  URL: string
  URLHash: URLHash
  category: WebsiteCategory
}, context: CallableContext): Promise<Returnable<null, string>> => {
  try {
    const { URL, URLHash, category } = data

    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(URL) !== URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Check if this user has already voted before on a category.
    const voterPreviousCategoryChoiceSnapshot = (await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.categoryVoter(URLHash, UID)).get())

    if (voterPreviousCategoryChoiceSnapshot.exists()) {
      // User has voted before, get the previous category choice.
      const voterPreviousCategoryChoice = voterPreviousCategoryChoiceSnapshot.val() as WebsiteCategory

      // We decrement the count of the previous category choice.
      await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.categoryCount(URLHash, voterPreviousCategoryChoice)).set(ServerValue.increment(-1))
    }

    // We increment the new category choice.
    await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.categoryCount(URLHash, category)).set(ServerValue.increment(1))

    // Add the voter to the voters list for the website category, or if the user has voted before then update their choice.
    await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.categoryVoter(URLHash, UID)).set(category)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'setWebsiteCategory' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
