// Packages:
import * as functions from 'firebase-functions/v1'
import { auth, database, firestore } from './config'
import logError from 'utils/logError'
import returnable from 'utils/returnable'
import OpenAI from 'openai'
import { sendEmail } from './email'
import { addNotification } from './notification'

// Typescript:
import {
  type ReportAnalysis,
  ReportConclusion,
  type Comment,
  type Reply,
  type Report,
} from 'types/comments-and-replies'
import type { Returnable } from 'types/index'
import { FieldValue } from 'firebase-admin/firestore'
import { ServerValue } from 'firebase-admin/database'
import {
  NotificationAction,
  NotificationType,
  type Notification,
} from 'types/notifications'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
import {
  EMAIL_FOR_REPORTED_REPORTED_CONTENT_HIDDEN,
  EMAIL_FOR_REPORTED_REPORTED_CONTENT_REMOVED,
  EMAIL_FOR_REPORTER_REPORTED_CONTENT_HIDDEN,
  EMAIL_FOR_REPORTER_REPORTED_CONTENT_NO_ACTION,
  EMAIL_FOR_REPORTER_REPORTED_CONTENT_REMOVED,
} from './emails/report'
const REPORT_REVIEW_BATCH_SIZE = 100

// Functions:
const fetchReportedContent = async (report: Report): Promise<Returnable<Comment | Reply | null, Error>> => {
  try {
    if (report.replyID) {
      const replySnapshot = await firestore
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(report.replyID)
        .get()

    if (!replySnapshot.exists) returnable.success(null)
    
    const reply = replySnapshot.data() as Reply
    if (reply.isDeleted || reply.isRemoved) returnable.success(null)

    return returnable.success(reply)
    } else {
      const commentSnapshot = await firestore
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
        .get()
      
      if (!commentSnapshot.exists) returnable.success(null)
      
      const comment = commentSnapshot.data() as Comment
      if (comment.isDeleted || comment.isRemoved) returnable.success(null)

      return returnable.success(comment)
    }
  } catch (error) {
    logError({ data: report, error, functionName: 'fetchReportedContent' })
    return returnable.fail(error as unknown as Error)
  }
}

const analyzeReportedContent = async (openai: OpenAI, content: string, report: Report): Promise<Returnable<ReportAnalysis, Error>> => {
  try {
    const prompt = `
Analyze the following content that was reported for the reason: "${report.reason}".
Content: "${content}"
    
Provide a JSON object with the following fields:
1. riskScore: A number from 0 to 10 indicating how hostile or inappropriate the content is.
2. conclusion: One of "NoAction", "Hidden", or "Removed".
3. reason: A brief explanation for the conclusion.
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  const result: ReportAnalysis = {
    riskScore: 0,
    conclusion: ReportConclusion.NoAction,
  }
  
  try {
    const parseResult = JSON.parse(response.choices[0].message.content ?? '{}') as ReportAnalysis

    result.riskScore = parseResult.riskScore
    result.conclusion = parseResult.conclusion
    if (parseResult.reason) result.reason = parseResult.reason
  } catch (error) {
    logError({ data: response, error, functionName: 'analyzeReportedContent.OpenAI' })
  }
  
  return returnable.success(result)

  } catch (error) {
    logError({ data: report, error, functionName: 'analyzeReportedContent' })
    return returnable.fail(error as unknown as Error)
  }
}

const updateReport = async (
  report: Report,
  content: Comment | Reply,
  analysis: ReportAnalysis
): Promise<Returnable<null, Error>> => {
  try {
    if (analysis.conclusion === ReportConclusion.Removed) {
      // Delete the item.
      if (report.replyID) {
        const replySnapshot = await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(report.replyID)
          .get()
        
        if (!replySnapshot.exists) throw new Error('Reply does not exist!')

        // Remove the reply details from Firestore Database.
        await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(report.replyID)
          .update({
            report: {
              reportCount: FieldValue.increment(-1) as unknown as number,
              reports: FieldValue.arrayRemove(report.id) as unknown as string[],
            },
            isRestricted: true,
            restriction: {
              restrictedOn: FieldValue.serverTimestamp(),
              restrictor: report.reporter,
              reason: analysis.reason,
            },
            isRemoved: true,
          } as Partial<Reply>)
        
        // Decrement the comment's reply count.
        await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .update({
            replyCount: FieldValue.increment(-1) as unknown as number,
          } as Partial<Comment>)
      } else {
        const commentSnapshot = await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .get()

        if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
        
        const comment = commentSnapshot.data() as Comment

        // Remove the comment details from Firestore Database.
        await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .update({
            report: {
              reportCount: FieldValue.increment(-1) as unknown as number,
              reports: FieldValue.arrayRemove(report.id) as unknown as string[],
            },
            isRestricted: true,
            restriction: {
              restrictedOn: FieldValue.serverTimestamp(),
              restrictor: report.reporter,
              reason: analysis.reason,
            },
            isRemoved: true,
          } as Partial<Comment>)

        // Delete the comment from the topics.
        const topics = comment.topics ?? []
        for await (const topic of topics) {
          await database
            .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentScore(topic, report.commentID))
            .remove()

          await database
            .ref(REALTIME_DATABASE_PATHS.TOPICS.topicCommentsCount(topic))
            .update(ServerValue.increment(-1))
        }

        // Decrement the website's comment count.
        await database
          .ref(REALTIME_DATABASE_PATHS.WEBSITES.commentCount(report.URLHash))
          .update(ServerValue.increment(-1))
      }
    } else if (analysis.conclusion === ReportConclusion.Hidden) {
      // Clear the report count to allow more reports to come in, and hide the item.
      if (report.replyID) {
        await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(report.replyID)
          .update({
            report: {
              reportCount: FieldValue.increment(-1) as unknown as number,
              reports: FieldValue.arrayRemove(report.id) as unknown as string[],
            },
            isRestricted: true,
            restriction: {
              restrictedOn: FieldValue.serverTimestamp(),
              restrictor: report.reporter,
              reason: analysis.reason,
            },
          } as Partial<Reply>)
      } else {
        await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .update({
            report: {
              reportCount: FieldValue.increment(-1) as unknown as number,
              reports: FieldValue.arrayRemove(report.id) as unknown as string[],
            },
            isRestricted: true,
            restriction: {
              restrictedOn: FieldValue.serverTimestamp(),
              restrictor: report.reporter,
              reason: analysis.reason,
            },
          } as Partial<Comment>)
      }
    } else if (analysis.conclusion === ReportConclusion.NoAction) {
      // Clear the report count to allow more reports to come in.
      if (report.replyID) {
        await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(report.replyID)
          .update({
            report: {
              reportCount: FieldValue.increment(-1) as unknown as number,
              reports: FieldValue.arrayRemove(report.id) as unknown as string[],
            },
          } as Partial<Reply>)
      } else {
        await firestore
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
          .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
          .update({
            report: {
              reportCount: FieldValue.increment(-1) as unknown as number,
              reports: FieldValue.arrayRemove(report.id) as unknown as string[],
            },
          } as Partial<Comment>)
      }
    }

    const reporter = await auth.getUser(report.reporter)
    const reporterUsername = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(report.reporter)).get()).val() as string | undefined
    const reported = await auth.getUser(content.author)
    const reportedUsername = (await database.ref(REALTIME_DATABASE_PATHS.USERS.username(content.author)).get()).val() as string | undefined
    
    // Send an email to the reporter that the content they reported has been removed, hidden, or no action was taken on it.
    if (reporterUsername && reportedUsername && reporter.email) {
      let title: string | null = null
      const subject = `${ reporterUsername }, we reviewed the content you reported recently on OpenReply`
      let html: string | null = null

      if (analysis.conclusion === ReportConclusion.Removed) {
        title = `We removed the ${ report.replyID ? 'reply' : 'comment' } you reported. See why.`
        html = EMAIL_FOR_REPORTER_REPORTED_CONTENT_REMOVED(reporterUsername, reportedUsername, report)
      } else if (analysis.conclusion === ReportConclusion.Hidden) {
        title = `We've hidden the ${ report.replyID ? 'reply' : 'comment' } you reported. See why.`
        html = EMAIL_FOR_REPORTER_REPORTED_CONTENT_HIDDEN(reporterUsername, reportedUsername, report)
      } else if (analysis.conclusion === ReportConclusion.NoAction) {
        title = `We didn't remove the ${ report.replyID ? 'reply' : 'comment' } you reported. See why.`
        html =  EMAIL_FOR_REPORTER_REPORTED_CONTENT_NO_ACTION(reporterUsername, reportedUsername, report)
      }
      
      if (html !== null && title !== null) {
        await sendEmail({
          to: reporter.email,
          subject,
          html,
        })

        const notification = {
          type: NotificationType.Visible,
          title,
          body: `You reported the ${ report.replyID ? 'reply' : 'comment' } "${ content.body }"`,
          action: report.replyID ? NotificationAction.ReplyReportResult : NotificationAction.CommentReportResult,
          payload: report.replyID ? {
            URLHash: report.URLHash,
            commentID: report.commentID,
            replyID: report.replyID,
            reportID: report.id,
          } : {
            URLHash: report.URLHash,
            commentID: report.commentID,
            reportID: report.id,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as Notification

        const addNotificationResult = await addNotification(reported.uid, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }

    // Send an email to the reported content's author that their content has been removed or hidden.
    if (reportedUsername && reported.email) {
      let title: string | null = null
      let subject: string | null = null
      let html: string | null = null

      if (analysis.conclusion === ReportConclusion.Removed) {
        title = `We removed your ${ report.replyID ? 'reply' : 'comment' }. See why.`
        subject = `${ reportedUsername }, we've removed your ${ report.replyID ? 'reply' : 'comment' } on OpenReply`
        html = EMAIL_FOR_REPORTED_REPORTED_CONTENT_REMOVED(reportedUsername, report)
      } else if (analysis.conclusion === ReportConclusion.Hidden) {
        title = `We've hidden your ${ report.replyID ? 'reply' : 'comment' }. See why.`
        subject = `${ reportedUsername }, we've hidden your ${ report.replyID ? 'reply' : 'comment' } on OpenReply`
        html = EMAIL_FOR_REPORTED_REPORTED_CONTENT_HIDDEN(reportedUsername, report)
      }

      if (subject !== null && html !== null && title !== null) {
        await sendEmail({
          to: reported.email,
          subject,
          html,
        })

        const notification = {
          type: NotificationType.Visible,
          title,
          body: `You ${ report.replyID ? 'replied' : 'commented' } "${ content.body }"`,
          action: report.replyID ? NotificationAction.ReplyReportResult : NotificationAction.CommentReportResult,
          payload: report.replyID ? {
            URLHash: report.URLHash,
            commentID: report.commentID,
            replyID: report.replyID,
            reportID: report.id,
          } : {
            URLHash: report.URLHash,
            commentID: report.commentID,
            reportID: report.id,
          },
          createdAt: FieldValue.serverTimestamp(),
        } as Notification

        const addNotificationResult = await addNotification(reported.uid, notification)
        if (!addNotificationResult.status) throw addNotificationResult.payload
      }
    }

    // Mark the report as reviewed.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.REPORTS.INDEX).doc(report.id)
      .update({
        isReviewed: true,
        analysis,
      } as Partial<Report>)

    return returnable.success(null)
  } catch (error) {
    logError({ data: report, error, functionName: 'updateReport' })
    return returnable.fail(error as unknown as Error)
  }
}

// Exports:
export const reviewReports = functions.pubsub
  .schedule('0 0 * * *') // Runs every day at midnight.
  .timeZone('America/New_York')
  .onRun(async () => {
    try {
      const reportsRef = firestore.collection(FIRESTORE_DATABASE_PATHS.REPORTS.INDEX)
      let lastReportSnapshot = null
      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'],
      })

      while (true) {
        let query = reportsRef
          .where('isReviewed', '==', false)
          .orderBy('reportedAt')
          .limit(REPORT_REVIEW_BATCH_SIZE)
  
        if (lastReportSnapshot) query = query.startAfter(lastReportSnapshot)
  
        const reportsSnapshot = await query.get()
  
        if (reportsSnapshot.empty) {
          console.error('No reports to process! Exiting reviewReports..')
          break
        }
  
        const reports = reportsSnapshot.docs.map(reportSnapshot => reportSnapshot.data() as Report)
  
        for await (const report of reports) {
          try {
            const fetchResponse = await fetchReportedContent(report)
            if (!fetchResponse.status) throw fetchResponse.payload
            if (fetchResponse.payload === null) {
              // Content does not exist, we can mark the report as reviewed.
              await firestore
                .collection(FIRESTORE_DATABASE_PATHS.REPORTS.INDEX).doc(report.id)
                .update({
                  isReviewed: true,
                } as Partial<Report>)
            } else {
              const analysisResponse = await analyzeReportedContent(openai, fetchResponse.payload.body, report)
              if (!analysisResponse.status) throw analysisResponse.payload
              
              await updateReport(report, fetchResponse.payload, analysisResponse.payload)
            }
          } catch (error) {
            logError({ data: report, error, functionName: 'reviewReports.report' })
          }
        }
  
        lastReportSnapshot = reportsSnapshot.docs[reportsSnapshot.docs.length - 1]
      }

      return returnable.success(null)
    } catch (error) {
      logError({ data: null, error, functionName: 'reviewReports' })
      return returnable.fail("We're currently facing some problems, please try again later!")
    }
  })
