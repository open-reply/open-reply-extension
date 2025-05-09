// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import { isEmpty, omitBy } from 'lodash'
import { setCachedReplyVote } from '@/entrypoints/background/localforage/votes'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'
import type { CommentID, Reply, ReplyID } from 'types/comments-and-replies'
import type { Vote } from 'types/votes'

// Exports:
/**
 * Add a reply to a comment.
 */
export const _addReply = async ({
  URL,
  URLHash,
  commentID,
  secondaryReplyID,
  domain,
  body,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  secondaryReplyID?: ReplyID
  domain: string
  body: string
}): Promise<Returnable<Reply, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const reply = omitBy({
      commentID,
      URLHash,
      domain,
      URL,
      body,
      secondaryReplyID,
    } as Reply, isEmpty)

    const addReply = httpsCallable(functions, 'addReply')

    const response = (await addReply(reply)).data as Returnable<Reply, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_addReply',
      data: {
        URL,
        URLHash,
        commentID,
        secondaryReplyID,
        domain,
        body,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Delete a reply.
 */
export const _deleteReply = async ({
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
      functionName: '_deleteReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Edit a reply.
 */
export const _editReply = async ({
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
      functionName: '_editReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
        body,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Report a reply.
 */
export const _reportReply = async ({
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
      functionName: '_reportReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
        reason,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Handles both upvoting and rolling back an upvote to a reply.
 */
export const _upvoteReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const upvoteReply = httpsCallable(functions, 'upvoteReply')

    const response = (await upvoteReply({ URL, URLHash, commentID, replyID })).data as Returnable<Vote | undefined, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedReplyVote(commentID, response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_upvoteReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Handles both downvoting and rolling back an downvote to a reply.
 */
export const _downvoteReply = async ({
  URL,
  URLHash,
  commentID,
  replyID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  replyID: ReplyID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const downvoteReply = httpsCallable(functions, 'downvoteReply')

    const response = (await downvoteReply({ URL, URLHash, commentID, replyID })).data as Returnable<Vote | undefined, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedReplyVote(commentID, response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_downvoteReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Bookmark a reply.
 */
export const _bookmarkReply = async ({
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

    const bookmarkReply = httpsCallable(functions, 'bookmarkReply')

    const response = (await bookmarkReply({ URL, URLHash, commentID, replyID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_bookmarkReply',
      data: {
        URL,
        URLHash,
        commentID,
        replyID,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
