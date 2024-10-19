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
  profilePicture,
}: {
  profilePicture: File
}): Promise<Returnable<string, Error>> => {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(profilePicture)
    const profilePictureSerializedData = JSON.stringify({
      data: Array.from(new Uint8Array(arrayBuffer)),
      contentType: profilePicture.type,
    })

    const { status, payload } = await new Promise<Returnable<string, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.STORAGE.users.set.setUserProfilePicture,
          payload: {
            profilePicture: {
              lastModified: profilePicture.lastModified,
              filename: profilePicture.name,
              size: profilePicture.size,
              mimeType: profilePicture.type,
              serializedData: profilePictureSerializedData,
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
      data: {
        profilePicture,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
