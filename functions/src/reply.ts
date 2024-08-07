// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'
import getURLHash from 'utils/getURLHash'
import { isEmpty, omitBy } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import checkHateSpeech from './utils/checkHateSpeech'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type {
  Comment,
  CommentID,
  ContentHateSpeechResult,
  ContentHateSpeechResultWithSuggestion,
  Reply,
  ReplyID,
  Report, 
  ReportID,
} from 'types/comments-and-replies'
import type { FlatReply, FlatReport } from 'types/user'
import type { URLHash } from 'types/websites'
import { FieldValue } from 'firebase-admin/firestore'
import { ActivityType, type ReplyActivity } from 'types/activity'
import { ServerValue } from 'firebase-admin/database'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_REPLY_REPORT_COUNT } from 'constants/database/comments-and-replies'

// Exports:
/**
 * Add a reply.
 */
export const addReply = async (data: Reply, context: CallableContext): Promise<Returnable<null, string>> => {
  try {
    const UID = context.auth?.uid
    if (!isAuthenticated(context) || !UID) return returnable.fail('Please login to continue!')
    
    const user = await auth.getUser(UID)
    const name = user.displayName
    const username = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(UID)).get()).val() as string | undefined
    const thoroughUserCheckResult = thoroughUserDetailsCheck(user, name, username)
    if (!thoroughUserCheckResult.status) return returnable.fail(thoroughUserCheckResult.payload)

    if (await getURLHash(data.URL) !== data.URLHash) throw new Error('Generated Hash for URL did not equal passed URLHash!')

    // Store the reply details in Firestore Database.
    data.id = uuidv4()
    data.createdAt = FieldValue.serverTimestamp()
    data.lastEditedAt = FieldValue.serverTimestamp()

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    data.hateSpeech = {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    }

    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.id)
      .create(omitBy<Reply>(data, isEmpty) as Partial<Reply>)

    // Increment the comment's reply count.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .update({
        replyCount: FieldValue.increment(1) as unknown as number,
      } as Partial<Comment>)

    // Save the flat reply to the user's document.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(data.author)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.REPLIES.INDEX).doc(data.id)
      .create({
        id: data.id,
        commentID: data.commentID,
        URLHash: data.URLHash,
        URL: data.URL,
        domain: data.domain,
        createdAt: data.createdAt,
      } as FlatReply)

    // Log the activity to Realtime Database.
    const activityID = uuidv4()
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
      .set(data.secondaryReplyID ? {
        type: ActivityType.RepliedToReply,
        commentID: data.commentID,
        URLHash: data.URLHash,
        activityAt: FieldValue.serverTimestamp(),
        primaryReplyID: data.id,
        secondaryReplyID: data.secondaryReplyID,
      } as ReplyActivity : {
        type: ActivityType.RepliedToComment,
        commentID: data.commentID,
        URLHash: data.URLHash,
        activityAt: FieldValue.serverTimestamp(),
        primaryReplyID: data.id,
      } as ReplyActivity)
    
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
      .update(ServerValue.increment(1))

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'addReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Edit a reply.
 */
export const editReply = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
    replyID: ReplyID
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

    // Verify if the editor is the reply author
    const replySnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
      .get()

    if (!replySnapshot.exists) throw new Error('Reply does not exist!')
    
    const reply = replySnapshot.data() as Reply
    if (reply.author !== UID) throw new Error('User is not authorized to edit this reply!')

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    const hateSpeech = {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    } as ContentHateSpeechResult

    // Edit the reply details in Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
      .update({
        body: data.body,
        lastEditedAt: FieldValue.serverTimestamp(),
        hateSpeech,
      } as Partial<Reply>)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'editReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Delete a reply.
 */
export const deleteReply = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
    replyID: ReplyID
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

    // Verify if the deletor is the reply author
    const replySnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
      .get()

    if (!replySnapshot.exists) throw new Error('Reply does not exist!')
    
    const reply = replySnapshot.data() as Reply
    if (reply.author !== UID) throw new Error('User is not authorized to delete this reply!')

    // Delete the reply details from Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
      .delete()

    // Decrement the comment's reply count.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .update({
        replyCount: FieldValue.increment(-1) as unknown as number,
      } as Partial<Comment>)

    // Delete the flat reply from the user's document.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(reply.author)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.REPLIES.INDEX).doc(data.replyID)
      .delete()

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'deleteReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Report a reply.
 */
export const reportReply = async (
  data: {
    URL: string
    URLHash: URLHash
    commentID: CommentID
    replyID: ReplyID,
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

    // Verify if the reply exists
    const replySnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
      .get()

    if (!replySnapshot.exists) throw new Error('Reply does not exist!')
    const reply = replySnapshot.data() as Reply

    if ((reply.report?.reportCount ?? 0) > MAX_REPLY_REPORT_COUNT) {
      // We have already received too many reports for this reply and are reviewing them.
      return returnable.success(null)
    }

    const report = {
      id: uuidv4() as ReportID,
      reason: data.reason,
      reportedAt: FieldValue.serverTimestamp(),
      reporter: UID,
      URLHash: data.URLHash,
      commentID: data.commentID,
      replyID: data.replyID,
    } as Report

    // Save the report to the `reports` collection.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.REPORTS.INDEX).doc(report.id)
      .create(report)

    // Update the reply details in Firestore Database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
      .update({
        report: {
          reportCount: FieldValue.increment(1) as unknown as number,
          reports: FieldValue.arrayUnion(report.id) as unknown as string[],
        }
      } as Partial<Reply>)

    // Add the flat report from the user's document.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(reply.author)
      .collection(FIRESTORE_DATABASE_PATHS.USERS.REPORTS.INDEX).doc(report.id)
      .create({
        id: report.id,
        reportedAt: report.reportedAt,
        reason: report.reason,
        URLHash: data.URLHash,
        commentID: report.commentID,
        replyID: report.replyID,
      } as FlatReport)

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'reportReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Check if a reply contains hate-speech.
 */
export const checkReplyForHateSpeech = async (
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
    logError({ data, error, functionName: 'checkReplyForHateSpeech' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
