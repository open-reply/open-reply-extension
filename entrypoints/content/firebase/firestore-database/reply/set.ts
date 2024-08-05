// Packages:
import { auth, functions } from '../..'
import { Timestamp } from 'firebase/firestore'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { v4 as uuidv4 } from 'uuid'
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
      id: uuidv4(),
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
      createdAt: Timestamp.now(),
      lastEditedAt: Timestamp.now(),
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
