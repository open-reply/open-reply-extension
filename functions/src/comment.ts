// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'
import getURLHash from 'utils/getURLHash'
import { truncate, uniq } from 'lodash'
import { indexWebsite } from './website'
import { v4 as uuidv4 } from 'uuid'
import Sentiment = require('sentiment')
import OpenAI from 'openai'
import checkHateSpeech from './utils/checkHateSpeech'
import getControversyScore from 'utils/getControversyScore'
import getWilsonScoreInterval from 'utils/getWilsonScoreInterval'
import getHotScore from 'utils/getHotScore'
// import getWebsiteTopicScore from 'utils/getWebsiteTopicScore'
import getTopicTasteScore from 'utils/getTopicTasteScore'
import shouldNotifyUserForVote from './utils/shouldNotifyUserForVote'
import shouldNotifyUserForBookmark from './utils/shouldNotifyUserForBookmark'
import { addNotification } from './notification'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type {
  Comment,
  CommentID,
  ContentHateSpeechResult,
  ContentHateSpeechResultWithSuggestion,
  Report,
  ReportID,
  Topic,
} from 'types/comments-and-replies'
import type { FlatComment, FlatReport } from 'types/user'
import type { URLHash } from 'types/websites'
import { ServerValue } from 'firebase-admin/database'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { FlatTopicComment } from 'types/topics'
import { ActivityType, type CommentActivity } from 'types/activity'
import { type Vote, VoteType } from 'types/votes'
// import type { WebsiteTopic } from 'types/realtime.database'
import type { TopicTaste } from 'types/taste'
import type { CommentBookmark, RealtimeBookmarkStats } from 'types/bookmarks'
import { type Notification, NotificationAction, NotificationType } from 'types/notifications'
import type { RealtimeDatabaseWebsiteSEO } from 'types/realtime.database'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_COMMENT_REPORT_COUNT, TOPICS } from 'constants/database/comments-and-replies'
// import { WEBSITE_TOPIC_SCORE_DELTA } from 'constants/database/websites'
import { TASTE_TOPIC_SCORE_DELTA } from 'constants/database/taste'
import OPENAI from './constants/openai'
import { WEEK } from 'time-constants'

// Functions:
/**
 * Perform sentiment analysis using AFINN.
 */
const getSentimentAnalsis = (body: string): Returnable<number, Error> => {
  try {
    const sentiment = new Sentiment()
    const analysis = sentiment.analyze(body)
    return returnable.success(analysis.comparative)
  } catch (error) {
    logError({ data: body, error, functionName: 'getSentimentAnalsis' })
    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Classify a given comment or reply to 3 topics.
 */
const getTopics = async (content: string, allTopics: Topic[]): Promise<Returnable<Topic[], Error>> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    })

    const prompt = `${OPENAI.INSTRUCTIONS.JSON}You need to classify the following content based on a list of topics. It may have up to 3 topics.

Classify the following content: "${content}"

List of topics: ${ JSON.stringify(allTopics) }

Provide a JSON array with the top 3 topics the content belongs to, in descending order. The JSON key containing this array should be named "topics".
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })

    const extractedTopics: Topic[] = []

    try {
      const parsedTopics = JSON.parse(response.choices[0].message.content ?? '{"topics": []}').topics as Topic[]

      if (Array.isArray(parsedTopics)) {
        extractedTopics.push(
          ...uniq(parsedTopics)
            .filter(parsedTopic => allTopics.includes(parsedTopic))
        )
      }
    } catch (error) {
      logError({
        data: {
          response,
          content: response.choices[0].message.content,
        },
        error,
        functionName: 'getTopics.OpenAI',
      })
    }

    return returnable.success(extractedTopics)
  } catch (error) {
    logError({ data: content, error, functionName: 'getTopics' })
    return returnable.fail(error as unknown as Error)
  }
}

// Exports:
/**
 * Add a comment.
 */
export const addComment = async (data: {
  comment: Comment
  website: {
    indexor: FirestoreDatabaseWebsite['indexor'],
    SEO: RealtimeDatabaseWebsiteSEO
  }
}, context: CallableContext): Promise<Returnable<Comment, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (
      await getURLHash(data.comment.URL) !== data.comment.URLHash ||
      await getURLHash(data.website.SEO.URL) !== data.comment.URLHash
    ) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Store the comment details in Firestore Database.
    const activityID = uuidv4()
    data.comment.id = uuidv4()
    data.comment.author = UID
    data.comment.createdAt = FieldValue.serverTimestamp()
    data.comment.lastEditedAt = FieldValue.serverTimestamp()
    data.comment.creationActivityID = activityID
    data.comment.replyCount = 0
    data.comment.voteCount = {
      up: 0,
      down: 0,
      controversy: 0,
      wilsonScore: 0,
    }

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.comment.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    data.comment.hateSpeech = (hateSpeechAnalysisResult.payload.isHateSpeech ? {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    } : {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
    }) as ContentHateSpeechResult

    // Add sentiment analysis details.
    const sentimentResponse = getSentimentAnalsis(data.comment.body)
    data.comment.sentiment = sentimentResponse.status ? sentimentResponse.payload : 0

    // Get the topics for the comment.
    const topicsResponse = await getTopics(data.comment.body, Object.values(TOPICS))
    if (!topicsResponse.status) throw topicsResponse.payload
    data.comment.topics = topicsResponse.payload
    
    // Add the comment to the database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.comment.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.comment.id)
      .create(data.comment)

    // Check if the website is indexed by checking the impression count on Realtime Database.
    const isWebsiteIndexed = (await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.impressions(data.comment.URLHash)).get()).exists()

    // Check if the website is indexed by checking the impression count on Realtime Database.
    const websiteSEOCapturedAt = ((await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.SEOCapturedAt(data.comment.URLHash)).get()).val() as number | undefined) ?? 0
    const shouldRecaptureWebsiteSEO = (Date.now() - websiteSEOCapturedAt) > WEEK

    // If the website is not indexed, index it.
    if (!isWebsiteIndexed || shouldRecaptureWebsiteSEO) {
      const indexWebsiteResult = await indexWebsite(
        {
          URLHash: data.comment.URLHash,
          website: data.website,
        },
        context,
        true,
        shouldRecaptureWebsiteSEO,
      )

      if (!indexWebsiteResult.status) throw new Error(indexWebsiteResult.payload)
    }

    // Increment the website's comment count.
    await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.commentCount(data.comment.URLHash))
      .set(ServerValue.increment(1))

    // Save the flat comment to the user's document.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.comment.author)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.COMMENTS.INDEX).doc(data.comment.id)
      .create({
        id: data.comment.id,
        URLHash: data.comment.URLHash,
        URL: data.comment.URL,
        domain: data.comment.domain,
        createdAt: data.comment.createdAt,
      } as FlatComment)

    // Save the comment to the topics.
    const topics = topicsResponse.payload
    for await (const topic of topics) {
      await database
        .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.comment.id))
        .set({
          author: data.comment.author,
          hotScore: 0,
          URLHash: data.comment.URLHash,
        } as FlatTopicComment)
      
      await database
        .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
        .set(ServerValue.increment(1))
    }

    // Update what the user talks about.
    if (topics.length > 0) {
      const talksAbout = {} as Record<Topic, any>

      topics.forEach(topic => {
        talksAbout[topic] = ServerValue.increment(1)
      })

      await database
        .ref(REALTIME_DATABASE_PATHS.USERS.talksAbout(UID))
        .update(talksAbout)
    }

    // Log the activity to Realtime Database.
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
      .set({
        type: ActivityType.CommentedOnWebsite,
        commentID: data.comment.id,
        URLHash: data.comment.URLHash,
        activityAt: ServerValue.TIMESTAMP,
      } as CommentActivity)
    
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
      .set(ServerValue.increment(1))

    // Increment the user's comment count.
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.commentCount(UID))
      .set(ServerValue.increment(1))
    
    return returnable.success(data.comment)
  } catch (error) {
    logError({ data, error, functionName: 'addComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Edit a comment.
 */
export const editComment = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
    body: string
  },
  context: CallableContext,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Verify if the editor is the comment author
    const commentSnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .get()
    const comment = commentSnapshot.data() as Comment | undefined

    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }
    
    if (comment.author !== UID) throw new Error('User is not authorized to edit this comment!')

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    const hateSpeech = (hateSpeechAnalysisResult.payload.isHateSpeech ? {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    } : {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
    }) as ContentHateSpeechResult

    // Get sentiment analysis details.
    const sentimentResponse = getSentimentAnalsis(data.body)

    // Get the topics for the comment.
    const topicsResponse = await getTopics(data.body, Object.values(TOPICS))
    if (!topicsResponse.status) throw topicsResponse.payload
    
    // Edit the comment details from Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .update({
        body: data.body,
        lastEditedAt: FieldValue.serverTimestamp(),
        sentiment: sentimentResponse.status ? sentimentResponse.payload : 0,
        topics: topicsResponse.payload,
        hateSpeech,
      } as Partial<Comment>)

    
    // Save the comment to the topics.
    const topics = topicsResponse.payload
    const previousTopics = comment.topics ?? []
    for await (const topic of topics) {
      if (previousTopics.includes(topic)) {
        // First check if the comment exists in the topic.
        // This is because comments in topics are purged every now and then, and this comment may not be in the location of the topic.
        const isCommentInTopic = (await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
          .get()).exists()

        if (isCommentInTopic) {
          await database
            .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
            .remove()
          
          await database
            .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
            .set(ServerValue.increment(-1))
        }
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
          .set({
            author: comment.author,
            hotScore: 0,
            URLHash: data.URLHash,
          } as FlatTopicComment)
        
        await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
          .set(ServerValue.increment(1))
      }
    }

    // Update what the user talks about.
    if (topics.length > 0) {
      const talksAbout = {} as Record<Topic, any>

      topics.forEach(topic => {
        if (!previousTopics.includes(topic)) {
          talksAbout[topic] = ServerValue.increment(1)
        }
      })

      previousTopics.forEach(previousTopic => {
        if (!topics.includes(previousTopic)) {
          talksAbout[previousTopic] = ServerValue.increment(-1)
        }
      })

      await database
        .ref(REALTIME_DATABASE_PATHS.USERS.talksAbout(UID))
        .update(talksAbout)
    }

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'editComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Delete a comment.
 */
export const deleteComment = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
  },
  context: CallableContext,
): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Verify if the deletor is the comment author
    const commentSnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .get()
    const comment = commentSnapshot.data() as Comment | undefined

    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }
    
    if (comment.author !== UID) throw new Error('User is not authorized to delete this comment!')

    // Delete the comment details from Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .update({
        isDeleted: true,
      } as Comment)

    // Decrement the website's comment count.
    await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.commentCount(data.URLHash))
      .set(ServerValue.increment(-1))

    // Delete the comment from the topics.
    const topics = comment.topics ?? []
    for await (const topic of topics) {
      // First check if the comment exists in the topic.
      // This is because comments in topics are purged every now and then, and this comment may not be in the location of the topic.
      const isCommentInTopic = (await database
        .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
        .get()).exists()
      
      if (isCommentInTopic) {
        await database
        .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
        .remove()
        
        await database
        .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
        .set(ServerValue.increment(-1))
      }
    }

    // Remove the activity associated with the creation of the reply.

    // Check if the comment creation activity exists in the recent activity.
    // This is because activities in recent activity are purged every now and then, and this comment creation activity may not be in the location of the recent activity.
    const isCommentInRecentActivity = (await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, comment.creationActivityID))
      .get()).exists()
    
    if (isCommentInRecentActivity) {
      await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, comment.creationActivityID))
      .remove()
      
      // Decrement the activity count.
      await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
      .set(ServerValue.increment(-1))
    }
  
    // Decrement the user's comment count.
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.commentCount(UID))
      .set(ServerValue.increment(-1))

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'deleteComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Report a reply.
 */
export const reportComment = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
    reason: string
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

    // Verify if the comment exists
    const commentSnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .get()
    const comment = commentSnapshot.data() as Comment | undefined

    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }

    if ((comment.report?.reportCount ?? 0) > MAX_COMMENT_REPORT_COUNT) {
      // We have already received too many reports for this comment and are reviewing them.
      return returnable.success(null)
    }

    const report = {
      id: uuidv4() as ReportID,
      reason: data.reason,
      reportedAt: FieldValue.serverTimestamp(),
      reporter: UID,
      URLHash: data.URLHash,
      commentID: data.commentID,
      isReviewed: false,
    } as Report

    // Save the report to the `reports` collection.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.REPORTS.INDEX).doc(report.id)
      .create(report)

    // Update the comment details in Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .update({
        report: {
          reportCount: FieldValue.increment(1) as unknown as number,
          reports: FieldValue.arrayUnion(report.id) as unknown as string[],
        }
      } as Partial<Comment>)

    // Add the flat report from the user's document.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(comment.author)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.REPORTS.INDEX).doc(report.id)
      .create({
        id: report.id,
        reportedAt: report.reportedAt,
        reason: report.reason,
        URLHash: data.URLHash,
        commentID: report.commentID,
      } as FlatReport)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'reportComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Check if a comment contains hate-speech.
 */
export const checkCommentForHateSpeech = async (
  data: string,
  context: CallableContext
): Promise<Returnable<ContentHateSpeechResultWithSuggestion, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')
    
    const hateSpeechAnalysisResult = await checkHateSpeech(data)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload

    return returnable.success(hateSpeechAnalysisResult.payload)
  } catch (error) {
    logError({ data, error, functionName: 'checkCommentForHateSpeech' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Handles both upvoting and rolling back an upvote to a comment.
 */
export const upvoteComment = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
  },
  context: CallableContext,
): Promise<Returnable<Vote | undefined, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false


    // Track the vote on RDB.
    const commentVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.commentVote(data.commentID, UID))
    const voteSnapshot = await commentVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    let finalVote: Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Upvote) {
        // The upvote button was clicked again. Rollback an upvote.
        isUpvoteRollback = true
        finalVote = undefined
        await commentVoteRef.remove()
      } else {
        // The vote was previously a downvote. Rollback the downvote and register an upvote.
        isDownvoteRollback = true
        finalVote = {
          vote: VoteType.Upvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote
        await commentVoteRef.update(finalVote)
      }
    } else {
      // This is a fresh upvote.
      finalVote = {
        vote: VoteType.Upvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote
      await commentVoteRef.update(finalVote)
    }
    

    // Track the comment's Controversial Score, Wilson Score, and Hot Score.
    const commentRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
    const commentSnapshot = await commentRef.get()
    const comment = commentSnapshot.data() as Comment | undefined

    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }

    const upvotes = isUpvoteRollback ? comment.voteCount.up - 1 : comment.voteCount.up + 1
    const downvotes = isDownvoteRollback ? comment.voteCount.down - 1 : comment.voteCount.down
    const createdOn = (comment.createdAt as Timestamp).toMillis()

    const controversy = getControversyScore(upvotes, downvotes)
    const wilsonScore = getWilsonScoreInterval(upvotes, downvotes)
    
    commentRef.update({
      'voteCount.up': FieldValue.increment(isUpvoteRollback ? -1 : 1),
      'voteCount.down': FieldValue.increment(isDownvoteRollback ? -1 : 0),
      'voteCount.controversy': controversy,
      'voteCount.wilsonScore': wilsonScore,
    })


    // Update the topic.
    const topics = comment.topics
    const hotScore = getHotScore(upvotes, downvotes, createdOn)
    for await (const topic of topics) {
      // First check if the comment exists in the topic.
      // This is because comments in topics are purged every now and then, and this comment may not be in the location of the topic.
      await database
        .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
        .transaction((flatTopicComment?: FlatTopicComment) => {
          if (flatTopicComment) {
            return {
              ...flatTopicComment,
              hotScore,
            } as FlatTopicComment
          } else {
            return {
              author: comment.author,
              URLHash: data.URLHash,
              hotScore,
            } as FlatTopicComment
          }
        })
    }
    
    
    // Check if the activity exists in the recent activity.
    // This is because activities in recent activity are purged every now and then, and this activity may not be in the location of the recent activity.
    const isInRecentActivity = (await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
      .get()).exists()

    // Update activity.
    if (isUpvoteRollback && vote) {
      // The activity probably already exists, and it tracked the previous upvote.

      if (isInRecentActivity) {
        // We remove that activity.
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .remove()

        // Decrement the activity count.
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
          .set(ServerValue.increment(-1))
      }
    } else if (isDownvoteRollback && vote) {
      // The activity probably already exists, and it tracked the previous downvote.

      // We update that activity to reflect this upvote.
      if (isInRecentActivity) {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .update({
            type: ActivityType.Upvoted,
            activityAt: ServerValue.TIMESTAMP,
          } as Partial<CommentActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Upvoted,
            activityAt: ServerValue.TIMESTAMP,
            commentID: data.commentID,
            URLHash: data.URLHash,
          } as CommentActivity)
      }
    } else {
      // This is a fresh upvote. We log this as a new activity.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
        .set({
          type: ActivityType.Upvoted,
          commentID: data.commentID,
          URLHash: data.URLHash,
          activityAt: ServerValue.TIMESTAMP,
        } as CommentActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .set(ServerValue.increment(1))
    }

    // Update the website's totalVotesOnComments.
    let totalVotesOnComments = (await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.totalVotesOnComments(data.URLHash))
      .get()).val()
    totalVotesOnComments = isNaN(totalVotesOnComments) ? 0 : totalVotesOnComments

    if (isUpvoteRollback || isDownvoteRollback) totalVotesOnComments--
    else totalVotesOnComments++

    // NOTE: Parked for future Website Recommendation Algorithm implementation.
    // Update the website's Website Topic Score.
    // for await (const topic of topics) {
    //   await database
    //     .ref(REALTIME_DATABASE_PATHS.WEBSITES.topic(data.URLHash, topic))
    //     .transaction((websiteTopic?: WebsiteTopic) => {
    //       const oldScore = websiteTopic?.score ?? 0

    //       let websiteTopicUpvotes = websiteTopic?.upvotes ?? 0
    //       let websiteTopicDownvotes = websiteTopic?.downvotes ?? 0

    //       if (isUpvoteRollback) websiteTopicUpvotes--
    //       else websiteTopicUpvotes++
    //       if (isDownvoteRollback) websiteTopicDownvotes--

    //       const newScore = getWebsiteTopicScore({
    //         upvotes: websiteTopicUpvotes,
    //         downvotes: websiteTopicDownvotes,
    //         totalVotesOnCommentsOnWebsite: totalVotesOnComments,
    //       })

    //       // Only update the score if the scoreDelta is higher than the cutoff.
    //       const scoreDelta = Math.abs(oldScore - newScore)
    //       if (scoreDelta > WEBSITE_TOPIC_SCORE_DELTA) {
    //         return {
    //           upvotes: websiteTopicUpvotes,
    //           downvotes: websiteTopicDownvotes,
    //           score: newScore,
    //         } as WebsiteTopic
    //       } else return websiteTopic
    //     })
    // }

    // Update the user's topic taste scores.
    for await (const topic of topics) {
      await database
        .ref(REALTIME_DATABASE_PATHS.TASTES.topicTaste(data.URLHash, topic))
        .transaction((topicTaste?: TopicTaste) => {
          const oldScore = topicTaste?.score ?? 0

          let userTopicUpvotes = topicTaste?.upvotes ?? 0
          let userTopicDownvotes = topicTaste?.downvotes ?? 0

          if (isUpvoteRollback) userTopicUpvotes--
          else userTopicUpvotes++
          if (isDownvoteRollback) userTopicDownvotes--

          const newScore = getTopicTasteScore({
            upvotes: userTopicUpvotes,
            downvotes: userTopicDownvotes,
            notInterested: topicTaste?.notInterested ?? 0,
          })

          // Only update the score if the scoreDelta is higher than the cutoff.
          const scoreDelta = Math.abs(oldScore - newScore)
          if (scoreDelta > TASTE_TOPIC_SCORE_DELTA) {
            return {
              ...topicTaste,
              upvotes: userTopicUpvotes,
              downvotes: userTopicDownvotes,
              score: newScore,
            } as TopicTaste
          } else return topicTaste
        })
    }

    // Send a notification to the comment author.
    if (!isUpvoteRollback) {
      // Only send the notification if it's not an upvote rollback.
      const totalVoteCount = comment.voteCount.up + comment.voteCount.down
      if (shouldNotifyUserForVote(totalVoteCount)) {
        const notification = {
          type: NotificationType.Visible,
          title: totalVoteCount > 0 ? `Your comment was voted on by @${ username } and ${ totalVoteCount - 1 } others` : `Your comment was voted on by @${ username }`,
          body: `You commented: "${ truncate(comment.body) }"`,
          action: NotificationAction.ShowComment,
          payload: {
            commentID: data.commentID,
            URLHash: data.URLHash,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as Notification
        const addNotificationResult = await addNotification(comment.author, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }
    
    return returnable.success(finalVote)
  } catch (error) {
    logError({ data, error, functionName: 'upvoteComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Handles both downvoting and rolling back an downvote to a comment.
 */
export const downvoteComment = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
  },
  context: CallableContext,
): Promise<Returnable<Vote | undefined, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')

    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false


    // Track the vote on RDB.
    const commentVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.commentVote(data.commentID, UID))
    const voteSnapshot = await commentVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    let finalVote: Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Downvote) {
        // The downvote button was clicked again. Rollback a downvote.
        isDownvoteRollback = true
        finalVote = undefined
        await commentVoteRef.remove()
      } else {
        // The vote was previously an upvote. Rollback the upvote and register a downvote.
        isUpvoteRollback = true
        finalVote = {
          vote: VoteType.Downvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote
        await commentVoteRef.update(finalVote)
      }
    } else {
      // This is a fresh downvote.
      finalVote = {
        vote: VoteType.Downvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote
      await commentVoteRef.update(finalVote)
    }


    // Track the comment's Controversial Score, Wilson Score, and Hot Score.
    const commentRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
    const commentSnapshot = await commentRef.get()
    const comment = commentSnapshot.data() as Comment | undefined

    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }

    const upvotes = isUpvoteRollback ? comment.voteCount.up - 1 : comment.voteCount.up
    const downvotes = isDownvoteRollback ? comment.voteCount.down - 1 : comment.voteCount.down + 1
    const createdOn = (comment.createdAt as Timestamp).toMillis()

    const controversy = getControversyScore(upvotes, downvotes)
    const wilsonScore = getWilsonScoreInterval(upvotes, downvotes)
    
    commentRef.update({
      'voteCount.up': FieldValue.increment(isUpvoteRollback ? -1 : 0),
      'voteCount.down': FieldValue.increment(isDownvoteRollback ? -1 : 1),
      'voteCount.controversy': controversy,
      'voteCount.wilsonScore': wilsonScore,
    })


    // Update the topic.
    const topics = comment.topics
    const hotScore = getHotScore(upvotes, downvotes, createdOn)
    for await (const topic of topics) {
      // First check if the comment exists in the topic.
      // This is because comments in topics are purged every now and then, and this comment may not be in the location of the topic.
      await database
        .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
        .transaction((flatTopicComment?: FlatTopicComment) => {
          if (flatTopicComment) {
            return {
              ...flatTopicComment,
              hotScore,
            } as FlatTopicComment
          } else {
            return {
              author: comment.author,
              URLHash: data.URLHash,
              hotScore,
            } as FlatTopicComment
          }
        })
    }


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
          .set(ServerValue.increment(-1))
      }
    } else if (isUpvoteRollback && vote) {
      // The activity already exists, and it tracked the previous upvote.

      // We update that activity to reflect this downvote.
      if (isInRecentActivity) {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .update({
            type: ActivityType.Downvoted,
            activityAt: ServerValue.TIMESTAMP,
          } as Partial<CommentActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Downvoted,
            activityAt: ServerValue.TIMESTAMP,
            commentID: data.commentID,
            URLHash: data.URLHash,
          } as CommentActivity)
      }
    } else {
      // This is a fresh downvote. We log this as a new activity.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
        .set({
          type: ActivityType.Downvoted,
          commentID: data.commentID,
          URLHash: data.URLHash,
          activityAt: ServerValue.TIMESTAMP,
        } as CommentActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .set(ServerValue.increment(1))
    }

    // Update the website's totalVotesOnComments.
    let totalVotesOnComments = (await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.totalVotesOnComments(data.URLHash))
      .get()).val()
    totalVotesOnComments = isNaN(totalVotesOnComments) ? 0 : totalVotesOnComments

    if (isUpvoteRollback || isDownvoteRollback) totalVotesOnComments--
    else totalVotesOnComments++

    // NOTE: Parked for future Website Recommendation Algorithm implementation.
    // Update the website's Website Topic Score.
    // for await (const topic of topics) {
    //   await database
    //   .ref(REALTIME_DATABASE_PATHS.WEBSITES.topic(data.URLHash, topic))
    //   .transaction((websiteTopic?: WebsiteTopic) => {
    //     const oldScore = websiteTopic?.score ?? 0

    //     let websiteTopicUpvotes = websiteTopic?.upvotes ?? 0
    //     let websiteTopicDownvotes = websiteTopic?.downvotes ?? 0

    //     if (isUpvoteRollback) websiteTopicUpvotes--
    //     if (isDownvoteRollback) websiteTopicDownvotes--
    //     else websiteTopicDownvotes++

    //     const newScore = getWebsiteTopicScore({
    //       upvotes: websiteTopicUpvotes,
    //       downvotes: websiteTopicDownvotes,
    //       totalVotesOnCommentsOnWebsite: totalVotesOnComments,
    //     })

    //     // Only update the score if the scoreDelta is higher than the cutoff.
    //     const scoreDelta = Math.abs(oldScore - newScore)
    //     if (scoreDelta > WEBSITE_TOPIC_SCORE_DELTA) {
    //       return {
    //         upvotes: websiteTopicUpvotes,
    //         downvotes: websiteTopicDownvotes,
    //         score: newScore,
    //       } as WebsiteTopic
    //     } else return websiteTopic
    //   })
    // }

    // Update the user's topic taste scores.
    for await (const topic of topics) {
      await database
        .ref(REALTIME_DATABASE_PATHS.TASTES.topicTaste(data.URLHash, topic))
        .transaction((topicTaste?: TopicTaste) => {
          const oldScore = topicTaste?.score ?? 0

          let userTopicUpvotes = topicTaste?.upvotes ?? 0
          let userTopicDownvotes = topicTaste?.downvotes ?? 0
          
          if (isUpvoteRollback) userTopicUpvotes--
          if (isDownvoteRollback) userTopicDownvotes--
          else userTopicDownvotes++

          const newScore = getTopicTasteScore({
            upvotes: userTopicUpvotes,
            downvotes: userTopicDownvotes,
            notInterested: topicTaste?.notInterested ?? 0,
          })

          // Only update the score if the scoreDelta is higher than the cutoff.
          const scoreDelta = Math.abs(oldScore - newScore)
          if (scoreDelta > TASTE_TOPIC_SCORE_DELTA) {
            return {
              ...topicTaste,
              upvotes: userTopicUpvotes,
              downvotes: userTopicDownvotes,
              score: newScore,
            } as TopicTaste
          } else return topicTaste
        })
    }

    // Send a notification to the comment author.
    if (!isDownvoteRollback) {
      // Only send the notification if it's not a downvote rollback.
      const totalVoteCount = comment.voteCount.up + comment.voteCount.down
      if (shouldNotifyUserForVote(totalVoteCount)) {
        const notification = {
          type: NotificationType.Visible,
          title: totalVoteCount > 0 ? `Your comment was voted on by @${ username } and ${ totalVoteCount - 1 } others` : `Your comment was voted on by @${ username }`,
          body: `You commented: "${ truncate(comment.body) }"`,
          action: NotificationAction.ShowComment,
          payload: {
            commentID: data.commentID,
            URLHash: data.URLHash,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as Notification
        const addNotificationResult = await addNotification(comment.author, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }

    return returnable.success(finalVote)
  } catch (error) {
    logError({ data, error, functionName: 'downvoteComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * When a user isn't interested in the comment **and** wishes to see less of it, we assume that they wish to see
 * less comments from those specific topics as well.
 * 
 * Of course, if the user wants to see less of the commenter, then we simply mute them via `muteUser`.
 */
export const notInterestedInComment = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
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

    const commentRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
    const commentSnapshot = await commentRef.get()
    const comment = commentSnapshot.data() as Comment | undefined

    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }

    const topics = comment.topics

    // Update the user's topic taste scores.
    for await (const topic of topics) {
      await database
        .ref(REALTIME_DATABASE_PATHS.TASTES.topicTaste(data.URLHash, topic))
        .transaction((topicTaste?: TopicTaste) => {
          const oldScore = topicTaste?.score ?? 0

          const newScore = getTopicTasteScore({
            upvotes: topicTaste?.upvotes ?? 0,
            downvotes: topicTaste?.downvotes ?? 0,
            notInterested: (topicTaste?.notInterested ?? 0) + 1,
          })

          // Only update the score if the scoreDelta is higher than the cutoff.
          const scoreDelta = Math.abs(oldScore - newScore)
          if (scoreDelta > TASTE_TOPIC_SCORE_DELTA) {
            return {
              ...topicTaste,
              score: newScore,
            } as TopicTaste
          } else return topicTaste
        })
    }
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'notInterestedInComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Bookmark a comment.
 */
export const bookmarkComment = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
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

    const commentRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
    const commentSnapshot = await commentRef.get()
    const comment = commentSnapshot.data() as Comment | undefined

    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }

    const isAlreadyBookmarkedByUserSnapshot = (await database
      .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.commentBookmarkedByUser(data.commentID, UID))
      .get())
    const isAlreadyBookmarkedByUser = isAlreadyBookmarkedByUserSnapshot.exists() ? !!isAlreadyBookmarkedByUserSnapshot.val() : false
    
    if (isAlreadyBookmarkedByUser) {
      // Remove from bookmarks
      await firestore
        .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
        .collection(FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_COMMENTS.INDEX).doc(data.commentID)
        .delete()
      
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.commentBookmarkCount(data.commentID))
        .update({
          bookmarkCount: ServerValue.increment(-1),
        } as Partial<RealtimeBookmarkStats>)
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.commentBookmarkedByUser(data.commentID, UID))
        .set(false)
    } else {
      // Add to bookmarks
      await firestore
        .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
        .collection(FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_COMMENTS.INDEX).doc(data.commentID)
        .set({
          bookmarkedAt: FieldValue.serverTimestamp(),
          URLHash: data.URLHash,
        } as CommentBookmark)
      
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.commentBookmarkCount(data.commentID))
        .update({
          bookmarkCount: ServerValue.increment(1),
        } as Partial<RealtimeBookmarkStats>)
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.commentBookmarkedByUser(data.commentID, UID))
        .set(true)
    }

    // Notify comment author that users are bookmarking their comment.
    if (!isAlreadyBookmarkedByUser) {
      const commentBookmarkCount = (await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.commentBookmarkCount(data.commentID))
        .get()).val() as number ?? 0
      
      if (commentBookmarkCount > 0 && shouldNotifyUserForBookmark(commentBookmarkCount)) {
        const comment = commentSnapshot.data() as Comment
        const notification = {
          type: NotificationType.Visible,
          title: `Good job! Your comment was bookmarked by ${ commentBookmarkCount }${commentBookmarkCount <= 1 ? ' person' : '+ people'}!`,
          body: `You commented: "${ truncate(comment.body) }"`,
          action: NotificationAction.ShowComment,
          payload: {
            commentID: data.commentID,
            URLHash: data.URLHash,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as Notification
        const addNotificationResult = await addNotification(comment.author, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'bookmarkComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
