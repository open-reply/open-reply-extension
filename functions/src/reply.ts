// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'
import getURLHash from 'utils/getURLHash'
import { v4 as uuidv4 } from 'uuid'
import checkHateSpeech from './utils/checkHateSpeech'
import getControversyScore from 'utils/getControversyScore'
import getWilsonScoreInterval from 'utils/getWilsonScoreInterval'
import shouldNotifyUserForVote from './utils/shouldNotifyUserForVote'
import shouldNotifyUserForBookmark from './utils/shouldNotifyUserForBookmark'
import { addNotification } from './notification'
import shouldNotifyUserForReply from './utils/shouldNotifyUserForReply'
import { truncate } from 'lodash'

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
import {
  NotificationType,
  NotificationAction,
  type ShowReplyNotification,
} from 'types/notifications'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import { MAX_REPLY_REPORT_COUNT } from 'constants/database/comments-and-replies'

// Exports:
/**
 * Add a reply.
 */
export const addReply = async (
  data: Reply,
  context: CallableContext,
): Promise<Returnable<Reply, string>> => {
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
    data.author = UID
    data.createdAt = FieldValue.serverTimestamp()
    data.lastEditedAt = FieldValue.serverTimestamp()
    data.creationActivityID = activityID
    data.voteCount = {
      up: 0,
      down: 0,
      controversy: 0,
      wilsonScore: 0,
    }

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    data.hateSpeech = (hateSpeechAnalysisResult.payload.isHateSpeech ? {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    } : {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
    }) as ContentHateSpeechResult

    // Check if the comment exists.
    const commentSnapshot = await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .get()
    const comment = commentSnapshot.data() as Comment | undefined
    if (!commentSnapshot.exists || !comment || comment?.isDeleted || comment?.isRemoved) {
      throw new Error('Comment does not exist!')
    }

    // Add the reply to the database.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.id)
      .create(data)

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
      .create(data.secondaryReplyID ? {
        id: data.id,
        commentID: data.commentID,
        secondaryReplyID: data.secondaryReplyID,
        URLHash: data.URLHash,
        URL: data.URL,
        domain: data.domain,
        createdAt: data.createdAt,
      } as FlatReply : {
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
        activityAt: ServerValue.TIMESTAMP,
        primaryReplyID: data.id,
        secondaryReplyID: data.secondaryReplyID,
      } as ReplyActivity : {
        type: ActivityType.RepliedToComment,
        commentID: data.commentID,
        URLHash: data.URLHash,
        activityAt: ServerValue.TIMESTAMP,
        primaryReplyID: data.id,
      } as ReplyActivity)
    
    await database
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
      .set(ServerValue.increment(1))

    let secondaryReplyAuthorIsCommentAuthor = false
    if (data.secondaryReplyID) {
      const secondaryReplyRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.secondaryReplyID)
      const secondaryReplySnapshot = await secondaryReplyRef.get()
      const secondaryReply = secondaryReplySnapshot.data() as Reply | undefined

      if (
        secondaryReplySnapshot.exists &&
        !!secondaryReply &&
        !secondaryReply.isDeleted &&
        !secondaryReply.isRemoved &&
        secondaryReply.author !== UID
      ) {
        if (comment.author === secondaryReply.author) secondaryReplyAuthorIsCommentAuthor = true
        const notification = {
          type: NotificationType.Visible,
          title: `@${ username } replied to you: "${ data.body }"`,
          body: `You replied: "${ truncate(secondaryReply.body) }"`,
          action: NotificationAction.ShowReply,
          payload: {
            UID,
            username,
            URLHash: data.URLHash,
            commentID: data.commentID,
            replyID: data.id,
            originalReplyID: secondaryReply.id,
            isReplyToReply: true,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as ShowReplyNotification
        const addNotificationResult = await addNotification(secondaryReply.author, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }
    
    // Send a notification to the comment author, if they are not the second reply author, and the reply author is not the comment author.
    const replyCount = comment.replyCount ?? 1
    if (
      shouldNotifyUserForReply(replyCount) &&
      !secondaryReplyAuthorIsCommentAuthor &&
      comment.author !== UID
    ) {
      const notification = {
        type: NotificationType.Visible,
        title: replyCount > 1 ? `@${ username } and ${ replyCount - 1 } others replied to your comment.` : `@${ username } replied to your comment: "${ data.body }"`,
        body: `You commented: "${ truncate(comment.body) }"`,
        action: NotificationAction.ShowReply,
        payload: {
          UID,
          username,
          URLHash: data.URLHash,
          commentID: data.commentID,
          replyID: data.id,
        },
        createdAt: FieldValue.serverTimestamp(),
      } as ShowReplyNotification
      const addNotificationResult = await addNotification(comment.author, notification)
      if (!addNotificationResult.status) throw addNotificationResult.payload
    }

    // Increment the user's reply count.
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.replyCount(UID))
      .set(ServerValue.increment(1))

    return returnable.success(data)
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
    const reply = replySnapshot.data() as Reply | undefined

    if (!replySnapshot.exists || !reply || reply?.isDeleted || reply?.isRemoved) {
      throw new Error('Reply does not exist!')
    }
    
    if (reply.author !== UID) throw new Error('User is not authorized to edit this reply!')

    // Check for hate-speech.
    const hateSpeechAnalysisResult = await checkHateSpeech(data.body, true)
    if (!hateSpeechAnalysisResult.status) throw hateSpeechAnalysisResult.payload
    const hateSpeech = (hateSpeechAnalysisResult.payload.isHateSpeech ? {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
      reason: hateSpeechAnalysisResult.payload.reason,
    } : {
      isHateSpeech: hateSpeechAnalysisResult.payload.isHateSpeech,
    }) as ContentHateSpeechResult

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
    const reply = replySnapshot.data() as Reply | undefined

    if (!replySnapshot.exists || !reply || reply?.isDeleted || reply?.isRemoved) {
      throw new Error('Reply does not exist!')
    }
    
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
      .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
      .set(ServerValue.increment(-1))

    // Decrement the user's reply count.
    await database
      .ref(REALTIME_DATABASE_PATHS.USERS.replyCount(UID))
      .set(ServerValue.increment(-1))

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
    const reply = replySnapshot.data() as Reply | undefined

    if (!replySnapshot.exists || !reply || reply?.isDeleted || reply?.isRemoved) {
      throw new Error('Reply does not exist!')
    }

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
      isReviewed: false,
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
    const replyVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.replyVote(data.replyID, UID))
    const voteSnapshot = await replyVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    let finalVote: Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Upvote) {
        // The upvote button was clicked again. Rollback an upvote.
        isUpvoteRollback = true
        finalVote = undefined
        await replyVoteRef.remove()
      } else {
        // The vote was previously a downvote. Rollback the downvote and register an upvote.
        isDownvoteRollback = true
        finalVote = {
          vote: VoteType.Upvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote
        await replyVoteRef.update(finalVote)
      }
    } else {
      // This is a fresh upvote.
      finalVote = {
        vote: VoteType.Upvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote
      await replyVoteRef.update(finalVote)
    }
    

    // Track the reply's Controversial Score, Wilson Score, and Hot Score.
    const replyRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
    const replySnapshot = await replyRef.get()
    const reply = replySnapshot.data() as Reply | undefined

    if (!replySnapshot.exists || !reply || reply?.isDeleted || reply?.isRemoved) {
      throw new Error('Reply does not exist!')
    }

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
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .set(ServerValue.increment(-1))
      }
    } else if (isDownvoteRollback && vote) {
      // The activity already exists, and it tracked the previous downvote.

      // We update that activity to reflect this upvote.
      if (isInRecentActivity) {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .update({
            type: ActivityType.Upvoted,
            activityAt: ServerValue.TIMESTAMP,
          } as Partial<ReplyActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Upvoted,
            activityAt: ServerValue.TIMESTAMP,
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
          activityAt: ServerValue.TIMESTAMP,
          primaryReplyID: data.replyID,
          secondaryReplyID: reply.secondaryReplyID,
        } as ReplyActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .set(ServerValue.increment(1))
    }

    // Send a notification to the reply author.
    if (!isUpvoteRollback) {
      // Only send the notification if it's not an upvote rollback.
      const totalVoteCount = reply.voteCount.up + reply.voteCount.down
      if (shouldNotifyUserForVote(totalVoteCount)) {
        const notification = {
          type: NotificationType.Visible,
          title: totalVoteCount > 0 ? `Your reply was voted on by @${ username } and ${ totalVoteCount - 1 } others` : `Your reply was voted on by @${ username }`,
          body: `You replied: "${ truncate(reply.body) }"`,
          action: NotificationAction.ShowReply,
          payload: {
            UID,
            username,
            URLHash: data.URLHash,
            commentID: data.commentID,
            replyID: data.replyID,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as ShowReplyNotification
        const addNotificationResult = await addNotification(reply.author, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }

    return returnable.success(finalVote)
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
    const replyVoteRef = database.ref(REALTIME_DATABASE_PATHS.VOTES.replyVote(data.replyID, UID))
    const voteSnapshot = await replyVoteRef.get()
    const vote = voteSnapshot.val() as Vote | undefined
    let finalVote: Vote | undefined
    const activityID = vote ? vote?.activityID : uuidv4()

    if (voteSnapshot.exists() && vote) {
      // If a vote already exists, this it is a rollback.
      if (vote.vote === VoteType.Downvote) {
        // The downvote button was clicked again. Rollback a downvote.
        isDownvoteRollback = true
        finalVote = undefined
        await replyVoteRef.remove()
      } else {
        // The vote was previously an upvote. Rollback the upvote and register a downvote.
        isUpvoteRollback = true
        finalVote = {
          vote: VoteType.Downvote,
          votedOn: ServerValue.TIMESTAMP,
        } as Vote
        await replyVoteRef.update(finalVote)
      }
    } else {
      // This is a fresh downvote.
      finalVote = {
        vote: VoteType.Downvote,
        votedOn: ServerValue.TIMESTAMP,
        activityID,
      } as Vote
      await replyVoteRef.update(finalVote)
    }


    // Track the reply's Controversial Score, Wilson Score, and Hot Score.
    const replyRef = firestore
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(data.URLHash)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(data.commentID)
      .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(data.replyID)
    const replySnapshot = await replyRef.get()
    const reply = replySnapshot.data() as Reply | undefined

    if (!replySnapshot.exists || !reply || reply?.isDeleted || reply?.isRemoved) {
      throw new Error('Reply does not exist!')
    }

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
          } as Partial<ReplyActivity>)
      } else {
        await database
          .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY.recentyActivity(UID, activityID))
          .set({
            type: ActivityType.Downvoted,
            commentID: data.commentID,
            URLHash: data.URLHash,
            activityAt: ServerValue.TIMESTAMP,
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
          activityAt: ServerValue.TIMESTAMP,
          primaryReplyID: data.replyID,
          secondaryReplyID: reply.secondaryReplyID,
        } as ReplyActivity)
      
      // Increment the activity count.
      await database
        .ref(REALTIME_DATABASE_PATHS.RECENT_ACTIVITY_COUNT.recentActivityCount(UID))
        .set(ServerValue.increment(1))
    }

    // Send a notification to the reply author.
    if (!isDownvoteRollback) {
      // Only send the notification if it's not a downvote rollback.
      const totalVoteCount = reply.voteCount.up + reply.voteCount.down
      if (shouldNotifyUserForVote(totalVoteCount)) {
        const notification = {
          type: NotificationType.Visible,
          title: totalVoteCount > 0 ? `Your reply was voted on by @${ username } and ${ totalVoteCount - 1 } others` : `Your reply was voted on by @${ username }`,
          body: `You replied: "${ truncate(reply.body) }"`,
          action: NotificationAction.ShowReply,
          payload: {
            UID,
            username,
            URLHash: data.URLHash,
            commentID: data.commentID,
            replyID: data.replyID,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as ShowReplyNotification
        const addNotificationResult = await addNotification(reply.author, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }

    return returnable.success(finalVote)
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
    const reply = replySnapshot.data() as Reply | undefined

    if (!replySnapshot.exists || !reply || reply?.isDeleted || reply?.isRemoved) {
      throw new Error('Reply does not exist!')
    }
    
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

    // Notify reply author that users are bookmarking their reply.
    if (!isAlreadyBookmarkedByUser) {
      const replyBookmarkCount = (await database
        .ref(REALTIME_DATABASE_PATHS.BOOKMARKS.replyBookmarkCount(data.commentID))
        .get()).val() as number ?? 0
      
      if (replyBookmarkCount > 0 && shouldNotifyUserForBookmark(replyBookmarkCount)) {
        const reply = replySnapshot.data() as Reply
        const notification = {
          type: NotificationType.Visible,
          title: `Good job! Your reply was bookmarked by ${ replyBookmarkCount }${replyBookmarkCount <= 1 ? ' person' : '+ people'}!`,
          body: `You replied: "${ truncate(reply.body) }"`,
          action: NotificationAction.ShowReply,
          payload: {
            replyID: data.replyID,
            commentID: data.commentID,
            URLHash: data.URLHash,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as ShowReplyNotification
        const addNotificationResult = await addNotification(reply.author, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }
    
    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'bookmarkReply' })
    return returnable.fail("We're currently facing some problems, please try again later!")
  }
}
