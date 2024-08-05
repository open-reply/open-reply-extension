// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { auth, database, firestore } from './config'
import isAuthenticated from './utils/isAuthenticated'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'
import getURLHash from 'utils/getURLHash'
import { isEmpty, omitBy } from 'lodash'

// Typescript:
import { type CallableContext } from 'firebase-functions/v1/https'
import type { Returnable } from 'types/index'
import type { Comment, CommentID, Reply, ReplyID } from 'types/comments-and-replies'
import type { FlatReply } from 'types/user'
import type { URLHash } from 'types/websites'
import { FieldValue } from 'firebase-admin/firestore'

// Constants:
import { FIRESTORE_DATABASE_PATHS, REALTIME_DATABASE_PATHS } from 'constants/database/paths'

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

    return returnable.success(null)
  } catch (error) {
    logError({ data, error, functionName: 'addReply' })
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
