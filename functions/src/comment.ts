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

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { Comment, CommentID, Report, ReportID, Topic } from 'types/comments-and-replies'
import type { FlatComment, FlatReport } from 'types/user'
import type { URLHash } from 'types/websites'
import { ServerValue } from 'firebase-admin/database'
import { FieldValue } from 'firebase-admin/firestore'
import type { FlatTopicComment } from 'types/topics'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_COMMENT_REPORT_COUNT, TOPICS } from 'constants/database/comments-and-replies'

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
    data.comment.id = uuidv4()
    data.comment.createdAt = FieldValue.serverTimestamp()
    data.comment.lastEditedAt = FieldValue.serverTimestamp()

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
            hotScore: 0,
            URLHash: data.comment.URLHash,
          } as FlatTopicComment)
        
        await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
          .update(ServerValue.increment(1))
      }

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
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Verify if the editor is the comment author
    const commentSnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .get()

    if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
    
    const comment = commentSnapshot.data() as Comment
    if (comment.author !== UID) throw new Error('User is not authorized to edit this comment!')

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
      } as Partial<Comment>)

    
    // Save the comment to the topics.
    const topics = topicsResponse.payload
    const previousTopics = comment.topics ?? []
    for await (const topic of topics) {
      if (previousTopics.includes(topic)) {
        await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
          .remove()

        await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
          .update(ServerValue.increment(-1))
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, data.commentID))
          .set({
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
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

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
      .delete()

    // Decrement the website's comment count.
    await database
      .ref(REALTIME_DATABASE_PATHS.WEBSITES.commentCount(data.URLHash))
      .update(ServerValue.increment(-1))


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
