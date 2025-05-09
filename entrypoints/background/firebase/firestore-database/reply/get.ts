// Packages:
import { auth, firestore, functions } from '../..'
import {
  collection,
  doc,
  getDoc,
  query,
  orderBy as _orderBy,
  limit as _limit,
  startAfter,
  getDocs,
} from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import { _getReplyVote } from '../../realtime-database/votes/get'

// Typescript:
import type { Returnable } from 'types/index'
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { URLHash } from 'types/websites'
import type {
  CommentID,
  ContentHateSpeechResultWithSuggestion,
  Reply,
  ReplyID,
} from 'types/comments-and-replies'
import type { FlatReply, UID } from 'types/user'
import type { WithVote } from 'types/votes'
import type { LastVisibleInstance } from 'types/internal-messaging'

// Constants:
import { FIRESTORE_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Fetches the replies for a comment on a website.
 */
export const _getReplies = async ({
  URLHash,
  commentID,
  limit = 10,
  lastVisible = null,
}: {
  URLHash: URLHash
  commentID: CommentID
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  replies: WithVote<Reply>[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const repliesRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX,
      URLHash,
      FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX,
      commentID,
      FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX,
    )
    let repliesQuery = query(repliesRef, _limit(limit))
    repliesQuery = query(repliesQuery, _orderBy('createdAt', 'asc'))

    if (lastVisible) repliesQuery = query(repliesQuery, startAfter(lastVisible))

    const repliesSnapshot = await getDocs(repliesQuery)
    const replies: WithVote<Reply>[] = repliesSnapshot.docs.map(replySnapshot => replySnapshot.data() as Reply)

    // We only fetch the current user's vote for the reply if they are signed in.
    if (auth.currentUser) {
      for await (const reply of replies) {
        const {
          status: replyVoteStatus,
          payload: replyVotePayload
        } = await _getReplyVote({ replyID: reply.id })
        if (!replyVoteStatus) throw replyVotePayload
        reply.vote = replyVotePayload
      }
    }

    const newLastVisibleInstance = {
      snapshot: replies.length < limit ? null : (repliesSnapshot.docs[repliesSnapshot.docs.length - 1] ?? null) as QueryDocumentSnapshot<Reply> | null,
      id: replies.length < limit ? null : replies[replies.length - 1] ? replies[replies.length - 1].id : null,
      reachedEnd: replies.length < limit,
    }
    
    return returnable.success({
      replies,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getReplies',
      data: {
        URLHash,
        limit,
        lastVisible,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Fetches the replies posted by a user.
 */
export const _getUserReplies = async ({
  UID,
  limit = 10,
  lastVisible = null,
}: {
  UID: UID
  limit?: number
  lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null
}): Promise<Returnable<{
  replies: WithVote<Reply>[],
  lastVisibleInstance: LastVisibleInstance
}, Error>> => {
  try {
    const flatRepliesRef = collection(
      firestore,
      FIRESTORE_DATABASE_PATHS.USERS.INDEX,
      UID,
      FIRESTORE_DATABASE_PATHS.USERS.REPLIES.INDEX,
    )
    let flatRepliesQuery = query(flatRepliesRef, _orderBy('createdAt', 'asc'), _limit(limit))

    if (lastVisible) flatRepliesQuery = query(flatRepliesQuery, startAfter(lastVisible))

    const flatRepliesSnapshot = await getDocs(flatRepliesQuery)
    const flatReplies: FlatReply[] = flatRepliesSnapshot.docs.map(flatReplySnapshot => flatReplySnapshot.data() as FlatReply)

    const replies: WithVote<Reply>[] = []

    for await (const flatReply of flatReplies) {
      const {
        status: getReplyStatus,
        payload: getReplyPayload,
      } = await _getReply({
        replyID: flatReply.id,
        commentID: flatReply.commentID,
        URLHash: flatReply.URLHash,
      })
      if (getReplyStatus && getReplyPayload) replies.push(getReplyPayload)
    }

    // We only fetch the current user's vote for the reply if they are signed in.
    if (auth.currentUser) {
      for await (const reply of replies) {
        const {
          status: replyVoteStatus,
          payload: replyVotePayload
        } = await _getReplyVote({ replyID: reply.id })
        if (!replyVoteStatus) throw replyVotePayload
        reply.vote = replyVotePayload
      }
    }

    const newLastVisibleInstance = {
      snapshot: replies.length < limit ? null : (flatRepliesSnapshot.docs[flatRepliesSnapshot.docs.length - 1] ?? null),
      id: replies.length < limit ? null : replies[replies.length - 1] ? replies[replies.length - 1].id : null,
      reachedEnd: replies.length < limit,
    }
    
    return returnable.success({
      replies,
      lastVisibleInstance: newLastVisibleInstance,
    })
  } catch (error) {
    logError({
      functionName: '_getUserReplies',
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
 * Fetches the reply snapshot given a URLHash from the Firestore Database.
 * 
 * You can get the `URLHash` by using the `utils/getURLHash()` function.
 * 
 * Note that this does not return the vote of the current user. Call `_getReplyVote` separately for that.
 */
export const _getReply = async ({
  replyID,
  commentID,
  URLHash,
}: {
  replyID: ReplyID
  commentID: CommentID
  URLHash: URLHash
}): Promise<Returnable<Reply | undefined, Error>> => {
  try {
    return returnable.success(
      (
        await getDoc(
          doc(
            firestore,
            FIRESTORE_DATABASE_PATHS.WEBSITES.INDEX,
            URLHash,
            FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.INDEX,
            commentID,
            FIRESTORE_DATABASE_PATHS.WEBSITES.COMMENTS.REPLIES.INDEX,
            replyID,
          )
        ) as DocumentSnapshot<Reply>
      ).data()
    )
  } catch (error) {
    logError({
      functionName: '_getReply',
      data: URLHash,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Check if a reply contains hate-speech.
 */
export const _checkReplyForHateSpeech = async (reply: string): Promise<Returnable<ContentHateSpeechResultWithSuggestion, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const checkReplyForHateSpeech = httpsCallable(functions, 'checkReplyForHateSpeech')

    const response = (await checkReplyForHateSpeech(reply)).data as Returnable<ContentHateSpeechResultWithSuggestion, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(response.payload)
  } catch (error) {
    logError({
      functionName: '_checkReplyForHateSpeech',
      data: reply,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
