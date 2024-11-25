// Packages:
import { auth, firestore, functions } from '../..'
import {
  collection,
  query,
  orderBy as _orderBy,
  limit as _limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import { _getCommentVote } from '../../realtime-database/votes/get'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { URLHash } from 'types/websites'
import { OrderBy, type WithVote } from 'types/votes'
import type {
  Comment,
  CommentID,
  ContentHateSpeechResultWithSuggestion,
} from 'types/comments-and-replies'
import type { FlatComment, UID } from 'types/user'
import type { LastVisibleInstance } from 'types/internal-messaging'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

/**
 * Fetches the comments for a website.
 */
export const _getComments = async ({
  URLHash,
  limit = 10,
  orderBy = OrderBy.Popular,
  lastVisible = null,
}: {
  URLHash: URLHash
  limit?: number
  orderBy: OrderBy
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  comments: WithVote<Comment>[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const commentsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX, URLHash, FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX)
    let commentsQuery = query(commentsRef, _limit(limit))

    switch (orderBy) {
      case OrderBy.Oldest:
        commentsQuery = query(commentsQuery, _orderBy('createdAt', 'desc'))
        break
      case OrderBy.Newest:
        commentsQuery = query(commentsQuery, _orderBy('createdAt', 'asc'))
        break
      case OrderBy.Controversial:
        commentsQuery = query(commentsQuery, _orderBy('voteCount.controversy', 'desc'))
        break
      case OrderBy.Popular:
        commentsQuery = query(commentsQuery, _orderBy('voteCount.wilsonScore', 'desc'))
        break
    }

    if (lastVisible) commentsQuery = query(commentsQuery, startAfter(lastVisible))

    const commentsSnapshot = await getDocs(commentsQuery)
    const comments: WithVote<Comment>[] = commentsSnapshot.docs.map(commentSnapshot => commentSnapshot.data() as Comment)

    // We only fetch the current user's vote for the comment if they are signed in.
    if (auth.currentUser) {
      for await (const comment of comments) {
        const {
          status: commentVoteStatus,
          payload: commentVotePayload
        } = await _getCommentVote({ commentID: comment.id })
        if (!commentVoteStatus) throw commentVotePayload
        comment.vote = commentVotePayload
      }
    }

    const newLastVisibleInstance = {
      snapshot: comments.length < limit ? null : commentsSnapshot.docs[commentsSnapshot.docs.length - 1] ?? null,
      id: comments.length < limit ? null : comments[comments.length - 1] ? comments[comments.length - 1].id : null,
      reachedEnd: comments.length < limit,
    }
    
    return returnable.success({
      comments,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getComments',
      data: {
        URLHash,
        limit,
        orderBy,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the comments posted by a user.
 */
export const _getUserComments = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  comments: WithVote<Comment>[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const flatCommentsRef = collection(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID, FIRESTORE_DATABASE_PATHS.USERS.COMMENTS.INDEX)
    let flatCommentsQuery = query(flatCommentsRef, _orderBy('createdAt', 'asc'), _limit(limit))

    if (lastVisible) flatCommentsQuery = query(flatCommentsQuery, startAfter(lastVisible))

    const flatCommentsSnapshot = await getDocs(flatCommentsQuery)
    const flatComments: FlatComment[] = flatCommentsSnapshot.docs.map(commentSnapshot => commentSnapshot.data() as FlatComment)
    const comments: WithVote<Comment>[] = []

    for await (const flatComment of flatComments) {
      const {
        status: getCommentStatus,
        payload: getCommentPayload,
      } = await _getComment({
        commentID: flatComment.id,
        URLHash: flatComment.URLHash,
      })
      if (getCommentStatus && getCommentPayload) comments.push(getCommentPayload)
    }

    // We only fetch the current user's vote for the comment if they are signed in.
    if (auth.currentUser) {
      for await (const comment of comments) {
        const {
          status: commentVoteStatus,
          payload: commentVotePayload
        } = await _getCommentVote({ commentID: comment.id })
        if (!commentVoteStatus) throw commentVotePayload
        comment.vote = commentVotePayload
      }
    }

    const newLastVisibleInstance = {
      snapshot: comments.length < limit ? null : (flatCommentsSnapshot.docs[flatCommentsSnapshot.docs.length - 1] ?? null),
      id: comments.length < limit ? null : comments[comments.length - 1] ? comments[comments.length - 1].id : null,
      reachedEnd: comments.length < limit,
    }
    
    return returnable.success({
      comments,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getUserComments',
      data: {
        UID,
        limit,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the comment given the commentID and the URLHash from the Firestore Database.
 * 
 * Note that this does not return the vote of the current user. Call `_getCommentVote` separately for that.
 */
export const _getComment = async ({
  commentID,
  URLHash,
}: {
  commentID: CommentID
  URLHash: URLHash
}): Promise<Returnable<Comment | undefined, Error>> => {
  try {
    return returnable.success(
      (
        await getDoc(
          doc(
            firestore,
            FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX,
            URLHash,
            FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX,
            commentID
          )
        ) as DocumentSnapshot<Comment>
      ).data()
    )
  } catch (error) {
    logError({
      functionName: '_getComment',
      data: {
        commentID,
        URLHash,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Check if a comment contains hate-speech.
 */
export const _checkCommentForHateSpeech = async (comment: string): Promise<Returnable<ContentHateSpeechResultWithSuggestion, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const checkCommentForHateSpeech = httpsCallable(functions, 'checkCommentForHateSpeech')

    const response = (await checkCommentForHateSpeech(comment)).data as Returnable<ContentHateSpeechResultWithSuggestion, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_checkCommentForHateSpeech',
      data: comment,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
