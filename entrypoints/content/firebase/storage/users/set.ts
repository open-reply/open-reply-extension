// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import { readFileAsArrayBuffer } from '@/entrypoints/content/utils/fileUploadUtilities'

// Typescript:
import type { UID } from 'types/user'
import type { Returnable } from 'types/index'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Set the current user's profile picture.
 */
export const setUserProfilePicture = async ({
  UID,
  profilePicture,
}: {
  UID: UID
  profilePicture: File
}): Promise<Returnable<string, Error>> => {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(profilePicture)

    const { status, payload } = await new Promise<Returnable<string, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.STORAGE.users.set.setUserProfilePicture,
          payload: {
            UID,
            profilePicture: {
              filename: profilePicture.name,
              mimeType: profilePicture.type,
              size: profilePicture.size,
              data: arrayBuffer
            }
          },
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) return returnable.success(payload)
    else return returnable.fail(payload)
  } catch (error) {
    logError({
      functionName: 'setUserProfilePicture',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
