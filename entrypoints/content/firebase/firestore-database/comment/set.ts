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
import type { Comment, CommentID } from 'types/comments-and-replies'
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'

// Exports:
/**
 * Add a comment.
 */
export const addComment = async ({
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
}): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const comment = {
      id: uuidv4(),
      URLHash,
      domain,
      URL,
      author: auth.currentUser.uid,
      body,
      replyCount: 0,
      voteCount: {
        down: 0,
        score: 0,
        summation: 0,
        up: 0,
      },
      createdAt: Timestamp.now(),
      lastEditedAt: Timestamp.now(),
    } as Comment

    const website = {
      indexor: auth.currentUser.uid,
      URL,
      title,
      description,
      keywords,
      image,
      favicon,
      indexedOn: Timestamp.now(),
    } as FirestoreDatabaseWebsite

    const addComment = httpsCallable(functions, 'addComment')

    const response = (await addComment({ comment, website })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: 'addComment',
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

export const deleteComment = async ({
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
      functionName: 'deleteComment',
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
