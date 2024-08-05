// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'
import type { CommentID, Reply, ReplyID } from 'types/comments-and-replies'

// Exports:
/**
 * Add a reply to a comment.
 */
export const addReply = async ({
  URL,
  URLHash,
  commentID,
  domain,
  body,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  domain: string
  body: string
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const reply = {
      commentID,
      URLHash,
      domain,
      URL,
      body,
      author: auth.currentUser.uid,
      voteCount: {
        down: 0,
        score: 0,
        summation: 0,
        up: 0,
      },
    } as Reply

    const addReply = httpsCallable(functions, 'addReply')

    const response = (await addReply(reply)).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'addReply',
      data: {
        URL,
        URLHash,
        
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Delete a reply.
 */
export const deleteReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const deleteReply = httpsCallable(functions, 'deleteReply')

    const response = (await deleteReply({ URL, URLHash, commentID, replyID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'deleteReply',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Edit a reply.
 */
export const editReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
  body,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
  body: string
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const editReply = httpsCallable(functions, 'editReply')

    const response = (await editReply({ URL, URLHash, commentID, replyID, body })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'editReply',
      data: {
        URL,
        URLHash,
        commentID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Report a reply.
 */
export const reportReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
  reason,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
  reason: string
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const reportReply = httpsCallable(functions, 'reportReply')

    const response = (await reportReply({ URL, URLHash, commentID, replyID, reason })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'reportReply',
      data: {
        URL,
        URLHash,
        commentID,
        reason,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
