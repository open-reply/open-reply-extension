// Packages:
import { auth, functions } from '../..'
import returnable from 'utils/returnable'
import logError from 'utils/logError'
import thoroughAuthCheck from '@/entrypoints/background/utils/thoroughAuthCheck'
import { httpsCallable } from 'firebase/functions'

// Typescript:
import type { Returnable } from 'types'

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
  fullName
}: {
  username?: string
  fullName?: string
}): Promise<Returnable<null, Error>> => {
  try {
    if (!username && !fullName) return returnable.success(null)

    const authCheckResult = await thoroughAuthCheck(auth.currentUser)
    if (!authCheckResult.status || !auth.currentUser) throw authCheckResult.payload

    const updateRDBUser = httpsCallable(functions, 'updateRDBUser')

    const response = (await updateRDBUser({ username, fullName })).data as Returnable<null, string>
    if (!response.status) throw new Error(response.payload)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_updateRDBUser',
      data: {
        username,
        fullName,
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
