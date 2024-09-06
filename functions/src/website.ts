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
import {
  // chain,
  isEmpty,
  omitBy,
} from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import getControversyScore from 'utils/getControversyScore'
import getWilsonScoreInterval from 'utils/getWilsonScoreInterval'
// import getTopicTasteScore from 'utils/getTopicTasteScore'
import generateWebsiteDescription from './utils/generateWebsiteDescription'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type { URLHash, WebsiteFlag } from 'types/websites'
import type { RealtimeDatabaseWebsite } from 'types/realtime.database'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import { FieldValue } from 'firebase-admin/firestore'
import { type Vote, VoteType } from 'types/votes'
import { ActivityType, type WebsiteActivity } from 'types/activity'
// import type { Topic } from 'types/comments-and-replies'
// import type { TopicTaste } from 'types/taste'
import type { RealtimeBookmarkStats, WebsiteBookmark } from 'types/bookmarks'

// Constants:
import { HARMFUL_WEBSITE_REASON_WEIGHTS } from 'constants/database/websites'
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
// import { TASTE_TOPIC_SCORE_DELTA } from 'constants/database/taste'

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

    // Generate the website description using AI if not present, also classify if NSFW or not.
    if (
      !data.website.description ||
      data.website.description?.trim().length === 0
    ) {
      const {
        status: generateWebsiteDescriptionStatus,
        payload: generateWebsiteDescriptionPayload,
      } = await generateWebsiteDescription({
        URL: data.website.URL,
        title: data.website.title,
        keywords: data.website.keywords,
      })

      if (!generateWebsiteDescriptionStatus) throw generateWebsiteDescriptionPayload
      if (
        generateWebsiteDescriptionStatus &&
        generateWebsiteDescriptionPayload.successfulGeneration
      ) {
        data.website.description = generateWebsiteDescriptionPayload.description
        data.website.isNSFW = generateWebsiteDescriptionPayload.isNSFW
      }
    }
    
    // Store the website details in Firestore Database.
    data.website.indexedOn = FieldValue.serverTimestamp()
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
    data.websiteFlag.id = uuidv4()
    data.websiteFlag.flaggedAt = FieldValue.serverTimestamp()
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
 * Handles both downvoting and rolling back an downvote to a website.
 */
export const upvoteWebsite = async (
  data: {
    URL: string
    URLHash: URLHash
    website: FirestoreDatabaseWebsite
  },
  context: CallableContext,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Check if the website is indexed by checking the impression count on Realtime Database.
    const isWebsiteIndexed = (await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.impressions(data.URLHash)).get()).exists()

    // If the website is not indexed, index it.
    if (!isWebsiteIndexed) {
      const indexWebsiteResult = await indexWebsite(
        {
          URLHash: data.URLHash,
          website: data.website
        },
        context,
        true
      )

      if (!indexWebsiteResult.status) throw new Error(indexWebsiteResult.payload)
    }
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false


    // Track the vote on RDB.
    const websiteVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.websiteVote(data.URLHash, UID))
    const voteSnapshot = await websiteVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Upvote) {
        // The upvote button was clicked again. Rollback an upvote.
        isUpvoteRollback = true
        await websiteVoteRef.remove()
      } else {
        // The vote was previously a downvote. Rollback the downvote and register an upvote.
        isDownvoteRollback = true
        await websiteVoteRef.update({
          vote: VoteType.Upvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote)
      }
    } else {
      // This is a fresh upvote.
      await websiteVoteRef.update({
        vote: VoteType.Upvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote)
    }


    // Track the website's Controversial Score, Wilson Score, and Hot Score.
    const websiteRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
    const websiteSnapshot = await websiteRef.get()

    if (!websiteSnapshot.exists) throw new Error('Reply does not exist!')
    const website = websiteSnapshot.data() as FirestoreDatabaseWebsite
    const upvotes = isUpvoteRollback ? website.voteCount.up - 1 : website.voteCount.up + 1
    const downvotes = isDownvoteRollback ? website.voteCount.down - 1 : website.voteCount.down

    const controversy = getControversyScore(upvotes, downvotes)
    const wilsonScore = getWilsonScoreInterval(upvotes, downvotes)
    
    websiteRef.update({
      'voteCount.up': FieldValue.increment(isUpvoteRollback ? -1 : 1),
      'voteCount.down': FieldValue.increment(isDownvoteRollback ? -1 : 0),
      'voteCount.controversy': controversy,
      'voteCount.wilsonScore': wilsonScore,
    })


    // Check if the activity exists in the recent activity.
    // This is because activities in recent activity are purged every now and then, and this activity may not be in the location of the recent activity.
    const isInRecentActivity = (await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
      .get()).exists()

    // Update activity.
    if (isUpvoteRollback && vote) {
      // The activity already exists, and it tracked the previous upvote.

      if (isInRecentActivity) {
        // We remove that activity.
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .remove()
          
        // Decrement the activity count.
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
          .update(ServerValue.increment(-1))
      }
    } else if (isDownvoteRollback && vote) {
      // The activity already exists, and it tracked the previous downvote.

      // We update that activity to reflect this upvote.
      if (isInRecentActivity) {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .update({
            type: ActivityType.Upvoted,
            activityAt: FieldValue.serverTimestamp(),
          } as Partial<WebsiteActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Upvoted,
            activityAt: FieldValue.serverTimestamp(),
            URLHash: data.URLHash,
          } as WebsiteActivity)
      }
    } else {
      // This is a fresh upvote. We log this as a new activity.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
        .set({
          type: ActivityType.Upvoted,
          URLHash: data.URLHash,
          activityAt: FieldValue.serverTimestamp(),
        } as WebsiteActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .update(ServerValue.increment(1))
    }


    // NOTE: Parked for future Website Recommendation Algorithm implementation.
    // Update the user's topic taste scores.
    // const websiteTopics = (await database
    //   .ref(REALTIME_DATABASE_PATHS.WEBSITES.topics(data.URLHash))
    //   .get()).val() as Record<Topic, TopicTaste>
    
    // // Get the top 3 topics from the website topics object.
    // const topics = chain(websiteTopics)
    //   .toPairs()
    //   .sortBy(([, topic]) => -topic.score)
    //   .take(3)
    //   .map(([name]) => name)
    //   .value() as Topic[]

    // for await (const topic of topics) {
    //   await database
    //     .ref(REALTIME_DATABASE_PATHS.TASTES.topicTaste(UID, topic))
    //     .transaction((topicTaste?: TopicTaste) => {
    //       const oldScore = topicTaste?.score ?? 0

    //       let userTopicUpvotes = topicTaste?.upvotes ?? 0
    //       let userTopicDownvotes = topicTaste?.downvotes ?? 0

    //       if (isUpvoteRollback) userTopicUpvotes--
    //       else userTopicUpvotes++
    //       if (isDownvoteRollback) userTopicDownvotes--

    //       const newScore = getTopicTasteScore({
    //         upvotes: userTopicUpvotes,
    //         downvotes: userTopicDownvotes,
    //         notInterested: topicTaste?.notInterested ?? 0,
    //       })

    //       // Only update the score if the scoreDelta is higher than the cutoff.
    //       const scoreDelta = Math.abs(oldScore - newScore)
    //       if (scoreDelta > TASTE_TOPIC_SCORE_DELTA) {
    //         return {
    //           ...topicTaste,
    //           upvotes: userTopicUpvotes,
    //           downvotes: userTopicDownvotes,
    //           score: newScore,
    //         } as TopicTaste
    //       } else return topicTaste
    //     })
    // }

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'upvoteWebsite' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Handles both downvoting and rolling back an downvote to a website.
 */
export const downvoteWebsite = async (
  data: {
    URL: string
    URLHash: URLHash
    website: FirestoreDatabaseWebsite
  },
  context: CallableContext,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Check if the website is indexed by checking the impression count on Realtime Database.
    const isWebsiteIndexed = (await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.impressions(data.URLHash)).get()).exists()

    // If the website is not indexed, index it.
    if (!isWebsiteIndexed) {
      const indexWebsiteResult = await indexWebsite(
        {
          URLHash: data.URLHash,
          website: data.website
        },
        context,
        true
      )

      if (!indexWebsiteResult.status) throw new Error(indexWebsiteResult.payload)
    }
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false

    // Track the vote on RDB.
    const websiteVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.websiteVote(data.URLHash, UID))
    const voteSnapshot = await websiteVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Downvote) {
        // The downvote button was clicked again. Rollback a downvote.
        isDownvoteRollback = true
        await websiteVoteRef.remove()
      } else {
        // The vote was previously an upvote. Rollback the upvote and register a downvote.
        isUpvoteRollback = true
        await websiteVoteRef.update({
          vote: VoteType.Downvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote)
      }
    } else {
      // This is a fresh downvote.
      await websiteVoteRef.update({
        vote: VoteType.Downvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote)
    }


    // Track the website's Controversial Score, Wilson Score, and Hot Score.
    const websiteRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
    const websiteSnapshot = await websiteRef.get()

    const website = websiteSnapshot.data() as FirestoreDatabaseWebsite
    const upvotes = isUpvoteRollback ? website.voteCount.up - 1 : website.voteCount.up
    const downvotes = isDownvoteRollback ? website.voteCount.down - 1 : website.voteCount.down + 1

    const controversy = getControversyScore(upvotes, downvotes)
    const wilsonScore = getWilsonScoreInterval(upvotes, downvotes)
    
    websiteRef.update({
      'voteCount.up': FieldValue.increment(isUpvoteRollback ? -1 : 0),
      'voteCount.down': FieldValue.increment(isDownvoteRollback ? -1 : 1),
      'voteCount.controversy': controversy,
      'voteCount.wilsonScore': wilsonScore,
    })


    // Check if the activity exists in the recent activity.
    // This is because activities in recent activity are purged every now and then, and this activity may not be in the location of the recent activity.
    const isInRecentActivity = (await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
      .get()).exists()

    // Update activity.
    if (isDownvoteRollback && vote) {
      // The activity already exists, and it tracked the previous downvote.

      if (isInRecentActivity) {
        // We remove that activity.
        await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
        .remove()
        
        // Decrement the activity count.
        await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .update(ServerValue.increment(-1))
      }
    } else if (isUpvoteRollback && vote) {
      // The activity already exists, and it tracked the previous upvote.

      // We update that activity to reflect this downvote.
      if (isInRecentActivity) {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .update({
            type: ActivityType.Downvoted,
            activityAt: FieldValue.serverTimestamp(),
          } as Partial<WebsiteActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Downvoted,
            activityAt: FieldValue.serverTimestamp(),
            URLHash: data.URLHash,
          } as WebsiteActivity)
      }
    } else {
      // This is a fresh downvote. We log this as a new activity.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
        .set({
          type: ActivityType.Downvoted,
          URLHash: data.URLHash,
          activityAt: FieldValue.serverTimestamp(),
        } as WebsiteActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .update(ServerValue.increment(1))
    }


    // NOTE: Parked for future Website Recommendation Algorithm implementation.
    // Update the user's topic taste scores.
    // const websiteTopics = (await database
    //   .ref(REALTIME_DATABASE_PATHS.WEBSITES.topics(data.URLHash))
    //   .get()).val() as Record<Topic, TopicTaste>
    
    // // Get the top 3 topics from the website topics object.
    // const topics = chain(websiteTopics)
    //   .toPairs()
    //   .sortBy(([, topic]) => -topic.score)
    //   .take(3)
    //   .map(([name]) => name)
    //   .value() as Topic[]

    // for await (const topic of topics) {
    //   await database
    //     .ref(REALTIME_DATABASE_PATHS.TASTES.topicTaste(UID, topic))
    //     .transaction((topicTaste?: TopicTaste) => {
    //       const oldScore = topicTaste?.score ?? 0

    //       let userTopicUpvotes = topicTaste?.upvotes ?? 0
    //       let userTopicDownvotes = topicTaste?.downvotes ?? 0

    //       if (isUpvoteRollback) userTopicUpvotes--
    //       if (isDownvoteRollback) userTopicDownvotes--
    //       else userTopicDownvotes++

    //       const newScore = getTopicTasteScore({
    //         upvotes: userTopicUpvotes,
    //         downvotes: userTopicDownvotes,
    //         notInterested: topicTaste?.notInterested ?? 0,
    //       })

    //       // Only update the score if the scoreDelta is higher than the cutoff.
    //       const scoreDelta = Math.abs(oldScore - newScore)
    //       if (scoreDelta > TASTE_TOPIC_SCORE_DELTA) {
    //         return {
    //           ...topicTaste,
    //           upvotes: userTopicUpvotes,
    //           downvotes: userTopicDownvotes,
    //           score: newScore,
    //         } as TopicTaste
    //       } else return topicTaste
    //     })
    // }

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'downvoteWebsite' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Bookmark a website.
 */
export const bookmarkWebsite = async (
  data: {
    URL: string
    URLHash: URLHash
  },
  context: CallableContext,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    const websiteRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
    const websiteSnapshot = await websiteRef.get()

    if (!websiteSnapshot.exists) throw new Error('Website does not exist!')

    const isAlreadyBookmarkedByUserSnapshot = (await database
      .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.websiteBookmarkedByUser(data.URLHash, UID))
      .get())
    const isAlreadyBookmarkedByUser = isAlreadyBookmarkedByUserSnapshot.exists() ? !!isAlreadyBookmarkedByUserSnapshot.val() : false
    
    if (isAlreadyBookmarkedByUser) {
      // Remove from bookmarks
      await firestore
        .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
        .collection(FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_WEBSITES.INDEX).doc(data.URLHash)
        .delete()
      
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.websiteBookmarkCount(data.URLHash))
        .update({
          bookmarkCount: ServerValue.increment(-1),
        } as Partial<RealtimeBookmarkStats>)
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.websiteBookmarkedByUser(data.URLHash, UID))
        .set(false)
    } else {
      // Add to bookmarks
      await firestore
        .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
        .collection(FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_WEBSITES.INDEX).doc(data.URLHash)
        .set({
          bookmarkedAt: FieldValue.serverTimestamp(),
        } as WebsiteBookmark)
      
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.websiteBookmarkCount(data.URLHash))
        .update({
          bookmarkCount: ServerValue.increment(1),
        } as Partial<RealtimeBookmarkStats>)
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.websiteBookmarkedByUser(data.URLHash, UID))
        .set(true)
    }
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'bookmarkWebsite' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
