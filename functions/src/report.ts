// Packages:
import * as functions from 'firebase-functions/v1'
import { database, firestore } from './config'
import logError from 'utils/logError'
import returnable from 'utils/returnable'
import OpenAI from 'openai'

// Typescript:
import {
  ReportConclusion,
  type Comment,
  type Reply,
  type Report,
} from 'types/comments-and-replies'
import type { Returnable } from 'types/index'
import { FieldValue } from 'firebase-admin/firestore'
import { ServerValue } from 'firebase-admin/database'

interface ReportAnalysis {
  riskScore: number
  conclusion: ReportConclusion
  reason?: string
}

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'
const REPORT_REVIEW_BATCH_SIZE = 100

// Functions:
const fetchReportedContent = async (report: Report): Promise<Returnable<string, Error>> => {
  try {
    if (report.replyID) {
      const replySnapshot = await firestore
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX).doc(report.replyID)
        .get()

    if (!replySnapshot.exists) throw new Error('Reply does not exist!')
    
    const reply = replySnapshot.data() as Reply

    return returnable.success(reply.body)
    } else {
      const commentSnapshot = await firestore
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX).doc(report.URLHash)
        .collection(FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX).doc(report.commentID)
        .get()
      
      if (!commentSnapshot.exists) throw new Error('Comment does not exist!')
      
      const comment = commentSnapshot.data() as Comment

      return returnable.success(comment.body)
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

const updateReport = async (report: Report, analysis: ReportAnalysis): Promise<Returnable<null, Error>> => {
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

    // TODO: Send an email to the commentor and the reporter.

    // Delete the report document.
    await firestore
      .collection(FIRESTORE_DATABASE_PATHS.REPORTS.INDEX).doc(report.id)
      .delete()

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
          .where('conclusion', '==', null)
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

            const analysisResponse = await analyzeReportedContent(openai, fetchResponse.payload, report)
            if (!analysisResponse.status) throw analysisResponse.payload

            await updateReport(report, analysisResponse.payload)
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
