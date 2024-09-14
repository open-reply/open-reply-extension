// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import { serverTimestamp } from 'firebase/firestore'
import { setCachedCommentVote } from '@/entrypoints/background/localforage/votes'

// Typescript:
import type { Returnable } from 'types/index'
import type { URLHash } from 'types/websites'
import type { Comment, CommentID } from 'types/comments-and-replies'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { Vote } from 'types/votes'

// Exports:
/**
 * Add a comment.
 */
export const _addComment = async ({
  URL,
  URLHash,
  domain,
  body,
  website: {
    title,
    description,
    keywords,
    image,
    favicon,
  },
}: {
  URL: string
  URLHash: URLHash
  domain: string
  body: string
  website: {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    favicon?: string
  }
}): Promise<Returnable<Comment, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const comment = {
      URLHash,
      domain,
      URL,
      author: auth.currentUser.uid,
      body,
      replyCount: 0,
    } as Comment

    const website = {
      indexor: auth.currentUser.uid,
      URL,
      title,
      description,
      keywords,
      image,
      favicon,
      indexedOn: serverTimestamp(),
    } as FirestoreDatabaseWebsite

    const addComment = httpsCallable(functions, 'addComment')

    const response = (await addComment({ comment, website })).data as Returnable<Comment, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_addComment',
      data: {
        URL,
        URLHash,
        domain,
        body,
        website: {
          title,
          description,
          keywords,
          image,
          favicon,
        },
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Delete a comment.
 */
export const _deleteComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const deleteComment = httpsCallable(functions, 'deleteComment')

    const response = (await deleteComment({ URL, URLHash, commentID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_deleteComment',
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
 * Edit a comment.
 */
export const _editComment = async ({
  URL,
  URLHash,
  commentID,
  body,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
  body: string
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const editComment = httpsCallable(functions, 'editComment')

    const response = (await editComment({ URL, URLHash, commentID, body })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_editComment',
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
 * Reply a comment.
 */
export const _reportComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const reportComment = httpsCallable(functions, 'reportComment')

    const response = (await reportComment({ URL, URLHash, commentID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_reportComment',
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
 * Handles both upvoting and rolling back an upvote to a comment.
 */
export const _upvoteComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const upvoteComment = httpsCallable(functions, 'upvoteComment')

    const response = (await upvoteComment({ URL, URLHash, commentID })).data as Returnable<Vote | undefined, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedCommentVote(commentID, response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_upvoteComment',
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
 * Handles both downvoting and rolling back an downvote to a comment.
 */
export const _downvoteComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<Vote | undefined, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const downvoteComment = httpsCallable(functions, 'downvoteComment')

    const response = (await downvoteComment({ URL, URLHash, commentID })).data as Returnable<Vote | undefined, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedCommentVote(commentID, response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_downvoteComment',
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
 * Triggered when the user is not interested in the comment itself (and its topics).
 */
export const _notInterestedInComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const notInterestedInComment = httpsCallable(functions, 'notInterestedInComment')

    const response = (await notInterestedInComment({ URL, URLHash, commentID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_notInterestedInComment',
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
 * Bookmark a comment.
 */
export const _bookmarkComment = async ({
  URL,
  URLHash,
  commentID,
}: {
  URL: string
  URLHash: URLHash
  commentID: CommentID
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const bookmarkComment = httpsCallable(functions, 'bookmarkComment')

    const response = (await bookmarkComment({ URL, URLHash, commentID })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_bookmarkComment',
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
