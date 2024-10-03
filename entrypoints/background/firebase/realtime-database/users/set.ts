// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'
import { setCachedRDBUser } from '@/entrypoints/background/localforage/user'

// Typescript:
import type { Returnable } from 'types'
import type { RealtimeDatabaseUser } from 'types/realtime.database'

// Exports:
/**
 * After a user has signed up, this function helps create the boilerplate RDB user.
 */
export const _createRDBUser = async (): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const createRDBUser = httpsCallable(functions, 'createRDBUser')

    const response = (await createRDBUser()).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedRDBUser(auth.currentUser.uid, { joinDate: Date.now() } as RealtimeDatabaseUser)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_createRDBUser',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Update the user in RDB.
 */
export const _updateRDBUser = async ({
  username,
  fullName,
  bio,
  URLs,
}: {
  username?: string
  fullName?: string
  bio?: string
  URLs?: Record<number, string>
}): Promise<Returnable<null, Error>> => {
  try {
    if (
      !username &&
      !fullName
    ) return returnable.success(null)

    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const updateRDBUser = httpsCallable(functions, 'updateRDBUser')

    const response = (await updateRDBUser({ username, fullName, bio, URLs })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    if (username) {
      await setCachedRDBUser(auth.currentUser.uid, {
        username,
        usernameLastChangedDate: Date.now()
      } as RealtimeDatabaseUser)
    } if (fullName) {
      await setCachedRDBUser(auth.currentUser.uid, { fullName } as RealtimeDatabaseUser)
    } if (bio) {
      await setCachedRDBUser(auth.currentUser.uid, { bio } as RealtimeDatabaseUser)
    } if (URLs) {
      await setCachedRDBUser(auth.currentUser.uid, { URLs } as RealtimeDatabaseUser)
    }

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_updateRDBUser',
      data: {
        username,
        fullName,
        bio,
        URLs,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Update the user's username in RDB.
 */
export const _updateRDBUsername = async (username: string): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const updateRDBUsername = httpsCallable(functions, 'updateRDBUsername')

    const response = (await updateRDBUsername({ username })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedRDBUser(auth.currentUser.uid, {
      username,
      usernameLastChangedDate: Date.now()
    } as RealtimeDatabaseUser)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_updateRDBUsername',
      data: username,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Update the user's full name in RDB.
 */
export const _updateRDBUserFullName = async (fullName: string): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const updateRDBUserFullName = httpsCallable(functions, 'updateRDBUserFullName')

    const response = (await updateRDBUserFullName({ fullName })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedRDBUser(auth.currentUser.uid, { fullName } as RealtimeDatabaseUser)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_updateRDBUserFullName',
      data: fullName,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Set the user's bio.
 */
export const _updateRDBUserBio = async (bio: string): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const updateRDBUserBio = httpsCallable(functions, 'updateRDBUserBio')

    const response = (await updateRDBUserBio(bio)).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedRDBUser(auth.currentUser.uid, { bio } as RealtimeDatabaseUser)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_updateRDBUserBio',
      data: bio,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Set the user's URLs.
 */
export const _updateRDBUserURLs = async (URLs: Record<number, string>): Promise<Returnable<null, Error>> => {
  try {
    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const updateRDBUserBio = httpsCallable(functions, 'updateRDBUserURLs')

    const response = (await updateRDBUserBio(URLs)).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    await setCachedRDBUser(auth.currentUser.uid, { URLs } as RealtimeDatabaseUser)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_updateRDBUserURLs',
      data: URLs,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
