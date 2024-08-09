// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'
import getURLHash from 'utils/getURLHash'
import { isEmpty, omitBy, uniq } from 'lodash'
import { indexWebsite } from './website'
import { v4 as uuidv4 } from 'uuid'
import Sentiment = require('sentiment')
import OpenAI from 'openai'
import checkHateSpeech from './utils/checkHateSpeech'
import getControversyScore from 'utils/getControversyScore'
import getWilsonScoreInterval from 'utils/getWilsonScoreInterval'
import getHotScore from 'utils/getHotScore'
import getWebsiteTopicScore from 'utils/getWebsiteTopicScore'

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
import type { WebsiteTopic } from 'types/realtime.database'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_COMMENT_REPORT_COUNT, TOPICS } from 'constants/database/comments-and-replies'
import { WEBSITE_TOPIC_SCORE_DELTA } from 'constants/database/websites'

// Functions:
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

const getTopics = async (content: string, allTopics: Topic[]): Promise<Returnable<Topic[], Error>> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    })

    const prompt = `
You need to classify the following content based on a list of topics. It may have up to 5 topics.

Classify the following content: "${content}"

List of topics: ${ JSON.stringify(allTopics) }

Provide a JSON array with the topics the content belongs to, in descending order.
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  const extractedTopics: Topic[] = []

  try {
    const parsedTopics = JSON.parse(response.choices[0].message.content ?? '[]') as Topic[]

    if (Array.isArray(parsedTopics)) {
      extractedTopics.concat(
        uniq(parsedTopics)
          .filter(parsedTopic => allTopics.includes(parsedTopic))
      )
    }
  } catch (error) {
    logError({ data: response, error, functionName: 'getTopics.OpenAI' })
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
  website: FirestoreDatabaseWebsite
}, context: CallableContext): Promise<Returnable<null, string>> => {
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
      await getURLHash(data.website.URL) !== data.comment.URLHash
    ) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Store the comment details in Firestore Database.
    const activityID = uuidv4()
    data.comment.id = uuidv4()
    data.comment.createdAt = FieldValue.serverTimestamp()
    data.comment.lastEditedAt = FieldValue.serverTimestamp()
    data.comment.creationActivityID = activityID

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.comment.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    data.comment.hateSpeech = {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    }

    // Add sentiment analysis details.
    const sentimentResponse = getSentimentAnalsis(data.comment.body)
    data.comment.sentiment = sentimentResponse.status ? sentimentResponse.payload : 0

    // Get the topics for the comment.
    const topicsResponse = await getTopics(data.comment.body, Object.values(TOPICS))
    if (!topicsResponse.status) throw topicsResponse.payload
    data.comment.topics = topicsResponse.payload
    
    // Save the comment.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.comment.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.comment.id)
      .create(omitBy<Comment>(data.comment, isEmpty) as Partial<Comment>)

    // Check if the website is indexed by checking the impression count on Realtime Database.
    const isWebsiteIndexed = (await database.ref(REALTIME_DATABASE_PATHS.WEBSITES.impressions(data.comment.URLHash)).get()).exists()

    // If the website is not indexed, index it.
    if (!isWebsiteIndexed) {
      const indexWebsiteResult = await indexWebsite(
        {
          URLHash: data.comment.URLHash,
          website: data.website
        },
        context,
        true
      )

      if (!indexWebsiteResult.status) throw new Error(indexWebsiteResult.payload)
    }

    // Increment the website's comment count.
    await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.commentCount(data.comment.URLHash))
      .update(ServerValue.increment(1))

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
        .update(ServerValue.increment(1))
    }

    // Log the activity to Realtime Database.
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
      .set({
        type: ActivityType.CommentedOnWebsite,
        commentID: data.comment.id,
        URLHash: data.comment.URLHash,
        activityAt: FieldValue.serverTimestamp(),
      } as CommentActivity)
    
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
      .update(ServerValue.increment(1))

    return returnable.success(null)
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

    if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
    
    const comment = commentSnapshot.data() as Comment
    if (comment.author !== UID) throw new Error('User is not authorized to edit this comment!')

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    const hateSpeech = {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    } as ContentHateSpeechResult

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
            .update(ServerValue.increment(-1))
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
          .update(ServerValue.increment(1))
      }
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

    if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
    
    const comment = commentSnapshot.data() as Comment
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
      .update(ServerValue.increment(-1))

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
        .update(ServerValue.increment(-1))
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
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
      .update(ServerValue.increment(-1))
    }

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

    if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
    const comment = commentSnapshot.data() as Comment

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
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false


    // Track the vote on RDB.
    const commentVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.commentVote(data.commentID, UID))
    const voteSnapshot = await commentVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Upvote) {
        // The upvote button was clicked again. Rollback an upvote.
        isUpvoteRollback = true
        await commentVoteRef.remove()
      } else {
        // The vote was previously a downvote. Rollback the downvote and register an upvote.
        isDownvoteRollback = true
        await commentVoteRef.update({
          vote: VoteType.Upvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote)
      }
    } else {
      // This is a fresh upvote.
      await commentVoteRef.update({
        vote: VoteType.Upvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote)
    }
    

    // Track the comment's Controversial Score, Wilson Score, and Hot Score.
    const commentRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
    const commentSnapshot = await commentRef.get()

    if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
    const comment = commentSnapshot.data() as Comment
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
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
          .update(ServerValue.increment(-1))
      }
    } else if (isDownvoteRollback && vote) {
      // The activity probably already exists, and it tracked the previous downvote.

      // We update that activity to reflect this upvote.
      if (isInRecentActivity) {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .update({
            type: ActivityType.Upvoted,
            activityAt: FieldValue.serverTimestamp(),
          } as Partial<CommentActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Upvoted,
            activityAt: FieldValue.serverTimestamp(),
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
          activityAt: FieldValue.serverTimestamp(),
        } as CommentActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
        .update(ServerValue.increment(1))
    }

    // Update the website's totalVotesOnComments.
    let totalVotesOnComments = (await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.totalVotesOnComments(data.URLHash))
      .get()).val()
    totalVotesOnComments = isNaN(totalVotesOnComments) ? 0 : totalVotesOnComments

    if (isUpvoteRollback || isDownvoteRollback) totalVotesOnComments--
    else totalVotesOnComments++

    // Update the website's Website Topic Score.
    for await (const topic of topics) {
      await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.topic(data.URLHash, topic))
      .transaction((websiteTopic?: WebsiteTopic) => {
        const oldScore = websiteTopic?.score ?? 0

        let websiteTopicUpvotes = websiteTopic?.upvotes ?? 0
        let websiteTopicDownvotes = websiteTopic?.downvotes ?? 0

        if (isUpvoteRollback) websiteTopicUpvotes--
        else websiteTopicUpvotes++
        if (isDownvoteRollback) websiteTopicDownvotes--

        const newScore = getWebsiteTopicScore({
          upvotes: websiteTopicUpvotes,
          downvotes: websiteTopicDownvotes,
          totalVotesOnCommentsOnWebsite: totalVotesOnComments,
        })

        // Only update the score if the scoreDelta is higher than the cutoff.
        const scoreDelta = Math.abs(oldScore - newScore)
        if (scoreDelta > WEBSITE_TOPIC_SCORE_DELTA) {
          return {
            upvotes: websiteTopicUpvotes,
            downvotes: websiteTopicDownvotes,
            score: newScore,
          } as WebsiteTopic
        } else return websiteTopic
      })
    }
    
    return returnable.success(null)
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
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false


    // Track the vote on RDB.
    const commentVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.commentVote(data.commentID, UID))
    const voteSnapshot = await commentVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Downvote) {
        // The downvote button was clicked again. Rollback a downvote.
        isDownvoteRollback = true
        await commentVoteRef.remove()
      } else {
        // The vote was previously an upvote. Rollback the upvote and register a downvote.
        isUpvoteRollback = true
        await commentVoteRef.update({
          vote: VoteType.Downvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote)
      }
    } else {
      // This is a fresh downvote.
      await commentVoteRef.update({
        vote: VoteType.Downvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote)
    }


    // Track the comment's Controversial Score, Wilson Score, and Hot Score.
    const commentRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
    const commentSnapshot = await commentRef.get()

    if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
    const comment = commentSnapshot.data() as Comment
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
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
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
          } as Partial<CommentActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Downvoted,
            activityAt: FieldValue.serverTimestamp(),
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
          activityAt: FieldValue.serverTimestamp(),
        } as CommentActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
        .update(ServerValue.increment(1))
    }

    // Update the website's totalVotesOnComments.
    let totalVotesOnComments = (await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.totalVotesOnComments(data.URLHash))
      .get()).val()
    totalVotesOnComments = isNaN(totalVotesOnComments) ? 0 : totalVotesOnComments

    if (isUpvoteRollback || isDownvoteRollback) totalVotesOnComments--
    else totalVotesOnComments++

    // Update the website's Website Topic Score.
    for await (const topic of topics) {
      await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.topic(data.URLHash, topic))
      .transaction((websiteTopic?: WebsiteTopic) => {
        const oldScore = websiteTopic?.score ?? 0

        let websiteTopicUpvotes = websiteTopic?.upvotes ?? 0
        let websiteTopicDownvotes = websiteTopic?.downvotes ?? 0

        if (isUpvoteRollback) websiteTopicUpvotes--
        if (isDownvoteRollback) websiteTopicDownvotes--
        else websiteTopicDownvotes++

        const newScore = getWebsiteTopicScore({
          upvotes: websiteTopicUpvotes,
          downvotes: websiteTopicDownvotes,
          totalVotesOnCommentsOnWebsite: totalVotesOnComments,
        })

        // Only update the score if the scoreDelta is higher than the cutoff.
        const scoreDelta = Math.abs(oldScore - newScore)
        if (scoreDelta > WEBSITE_TOPIC_SCORE_DELTA) {
          return {
            upvotes: websiteTopicUpvotes,
            downvotes: websiteTopicDownvotes,
            score: newScore,
          } as WebsiteTopic
        } else return websiteTopic
      })
    }

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'downvoteComment' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

// notInterestedInCommentTopics
