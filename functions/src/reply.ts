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
import getControversyScore from 'utils/getControversyScore'
import getWilsonScoreInterval from 'utils/getWilsonScoreInterval'

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
import { VoteType, type Vote } from 'types/votes'
import type { RealtimeBookmarkStats, ReplyBookmark } from 'types/bookmarks'

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
    const activityID = uuidv4()
    data.id = uuidv4()
    data.createdAt = FieldValue.serverTimestamp()
    data.lastEditedAt = FieldValue.serverTimestamp()
    data.creationActivityID = activityID

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
      .update({
        isDeleted: true,
      } as Partial<Reply>)

    // Decrement the comment's reply count.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .update({
        replyCount: FieldValue.increment(-1) as unknown as number,
      } as Partial<Comment>)

    // Remove the activity associated with the creation of the reply.
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, reply.creationActivityID))
      .remove()

    // Decrement the activity count.
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
      .update(ServerValue.increment(-1))

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

/**
 * Handles both upvoting and rolling back an upvote to a reply.
 */
export const upvoteReply = async (
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
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false


    // Track the vote on RDB.
    const replyVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.replyVote(data.replyID, UID))
    const voteSnapshot = await replyVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Upvote) {
        // The upvote button was clicked again. Rollback an upvote.
        isUpvoteRollback = true
        await replyVoteRef.remove()
      } else {
        // The vote was previously a downvote. Rollback the downvote and register an upvote.
        isDownvoteRollback = true
        await replyVoteRef.update({
          vote: VoteType.Upvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote)
      }
    } else {
      // This is a fresh upvote.
      await replyVoteRef.update({
        vote: VoteType.Upvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote)
    }
    

    // Track the reply's Controversial Score, Wilson Score, and Hot Score.
    const replyRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
    const replySnapshot = await replyRef.get()

    if (!replySnapshot.exists) throw new Error('Reply does not exist!')
    const reply = replySnapshot.data() as Reply
    const upvotes = isUpvoteRollback ? reply.voteCount.up - 1 : reply.voteCount.up + 1
    const downvotes = isDownvoteRollback ? reply.voteCount.down - 1 : reply.voteCount.down

    const controversy = getControversyScore(upvotes, downvotes)
    const wilsonScore = getWilsonScoreInterval(upvotes, downvotes)
    
    replyRef.update({
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
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
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
          } as Partial<ReplyActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Upvoted,
            activityAt: FieldValue.serverTimestamp(),
            URLHash: data.URLHash,
            commentID: data.commentID,
            primaryReplyID: data.replyID,
            secondaryReplyID: reply.secondaryReplyID,
          } as ReplyActivity)
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
          primaryReplyID: data.replyID,
          secondaryReplyID: reply.secondaryReplyID,
        } as ReplyActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
        .update(ServerValue.increment(1))
    }

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'upvoteReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Handles both downvoting and rolling back an downvote to a reply.
 */
export const downvoteReply = async (
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
    
    let isUpvoteRollback = false
    let isDownvoteRollback = false


    // Track the vote on RDB.
    const replyVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.replyVote(data.replyID, UID))
    const voteSnapshot = await replyVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Downvote) {
        // The downvote button was clicked again. Rollback a downvote.
        isDownvoteRollback = true
        await replyVoteRef.remove()
      } else {
        // The vote was previously an upvote. Rollback the upvote and register a downvote.
        isUpvoteRollback = true
        await replyVoteRef.update({
          vote: VoteType.Downvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote)
      }
    } else {
      // This is a fresh downvote.
      await replyVoteRef.update({
        vote: VoteType.Downvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote)
    }


    // Track the reply's Controversial Score, Wilson Score, and Hot Score.
    const replyRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
    const replySnapshot = await replyRef.get()

    if (!replySnapshot.exists) throw new Error('Reply does not exist!')
    const reply = replySnapshot.data() as Reply
    const upvotes = isUpvoteRollback ? reply.voteCount.up - 1 : reply.voteCount.up
    const downvotes = isDownvoteRollback ? reply.voteCount.down - 1 : reply.voteCount.down + 1

    const controversy = getControversyScore(upvotes, downvotes)
    const wilsonScore = getWilsonScoreInterval(upvotes, downvotes)
    
    replyRef.update({
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
          } as Partial<ReplyActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Downvoted,
            commentID: data.commentID,
            URLHash: data.URLHash,
            activityAt: FieldValue.serverTimestamp(),
            primaryReplyID: data.replyID,
            secondaryReplyID: reply.secondaryReplyID,
          } as ReplyActivity)
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
          primaryReplyID: data.replyID,
          secondaryReplyID: reply.secondaryReplyID,
        } as ReplyActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentActivityCount(UID))
        .update(ServerValue.increment(1))
    }

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'downvoteReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}

/**
 * Bookmark a reply.
 */
export const bookmarkReply = async (
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
    
    const replyRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
    const replySnapshot = await replyRef.get()
    if (!replySnapshot.exists) throw new Error('Reply does not exist!')
    
    const isAlreadyBookmarkedByUserSnapshot = await database
      .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.replyBookmarkedByUser(data.replyID, UID))
      .get()
    const isAlreadyBookmarkedByUser = isAlreadyBookmarkedByUserSnapshot.exists() ? !!isAlreadyBookmarkedByUserSnapshot.val() : false

    if (isAlreadyBookmarkedByUser) {
      // Remove from bookmarks
      await firestore
        .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
        .collection(FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_REPLIES.INDEX).doc(data.replyID)
        .delete()
      
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.replyBookmarkCount(data.replyID))
        .update({
          bookmarkCount: ServerValue.increment(-1),
        } as Partial<RealtimeBookmarkStats>)
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.replyBookmarkedByUser(data.replyID, UID))
        .set(false)
    } else {
      // Add to bookmarks
      await firestore
        .collection(FIRESTORE_DATABASE_PATHS.USERS.INDEX).doc(UID)
        .collection(FIRESTORE_DATABASE_PATHS.USERS.BOOKMARKED_REPLIES.INDEX).doc(data.replyID)
        .set({
          bookmarkedAt: FieldValue.serverTimestamp(),
          URLHash: data.URLHash,
          commentID: data.commentID,
        } as ReplyBookmark)
      
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.replyBookmarkCount(data.replyID))
        .update({
          bookmarkCount: ServerValue.increment(1),
        } as Partial<RealtimeBookmarkStats>)
      await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.replyBookmarkedByUser(data.replyID, UID))
        .set(true)
    }
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'bookmarkReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
