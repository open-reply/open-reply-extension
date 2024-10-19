// Packages:
import { auth, storage } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'

// Typescript:
import type { Returnable } from 'types/index'

// Constants:
import STORAGE_PATHS from 'constants/storage/paths'

// Exports:
/**
 * Set the current user's profile picture.
 */
export const _setUserProfilePicture = async ({
  profilePicture,
}: {
  profilePicture: {
    lastModified: number
    filename: string
    size: number
    mimeType: string
    serializedData: string
  }
}): Promise<Returnable<string, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const receivedProfilePictureData = JSON.parse(profilePicture.serializedData)
    const profilePictureArrayBuffer = new Uint8Array(receivedProfilePictureData.data).buffer
    
    const reconstructedProfilePicture = new File(
      [profilePictureArrayBuffer],
      profilePicture.filename,
      {
        type: profilePicture.mimeType,
        lastModified: profilePicture.lastModified,
      }
    )
    const profilePictureRef = storageRef(storage, STORAGE_PATHS.USERS.profilePicture(auth.currentUser.uid))
    await uploadBytes(profilePictureRef, reconstructedProfilePicture)
    const profilePictureURL = await getDownloadURL(profilePictureRef)

    if (auth.currentUser.photoURL === null) await updateProfile(auth.currentUser, {
      photoURL: profilePictureURL
    })

    return returnable.success(profilePictureURL)
  } catch (error) {
    logError({
      functionName: '_setUserProfilePicture',
      data: {
        profilePicture,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
