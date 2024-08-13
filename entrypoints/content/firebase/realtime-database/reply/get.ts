// Packages:
import { auth, database } from '../..'
import { get, ref } from 'firebase/database'
import thoroughAuthCheck from '@/entrypoints/content/utils/thoroughAuthCheck'

// Typescript:
import type { Returnable } from 'types'
import type { ReplyID } from 'types/comments-and-replies'

// Constants:
import { REALTIME_DATABASE_PATHS } from 'constants/database/paths'

// Exports:
/**
 * Checks if a reply is bookmarked by the user.
 */
export const isReplyBookmarked = async (replyID: ReplyID): Promise<Returnable<boolean, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const isBookmarkedSnapshot = await get(ref(database, REALTIME_DATABASE_PATHS.BOOKMARKS.replyBookmarkedByUser(replyID, auth.currentUser.uid)))

    return returnable.success(isBookmarkedSnapshot.exists() ? isBookmarkedSnapshot.val() : false)
  } catch (error) {
    logError({
      functionName: 'isReplyBookmarked',
      data: replyID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
