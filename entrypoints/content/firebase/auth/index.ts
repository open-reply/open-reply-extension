// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { User, UserCredential } from 'firebase/auth'
import type { Returnable } from 'types'
import type { AUTH_MODE } from 'types/auth'
import type { RealtimeDatabaseUser } from 'types/realtime.database'

type BackgroundAuthenticationReturnable = Returnable<{
  userCredential: UserCredential
  isSuccessful: boolean
  shouldRetry: boolean
}, {
  toast?: {
    title: string
    description: string
  }
  isSuccessful: boolean
  shouldRetry: boolean
}>

type BackgroundAuthenticationWithGoogleReturnable = Returnable<{
  user: User & RealtimeDatabaseUser
  toast?: {
    title: string
    description: string
  }
}, Error>

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
/**
 * Authenticate the user with email address and password, handles either login or signup.
 */
export const authenticateWithEmailAndPassword = async (
  {
    emailAddress,
    password,
    mode,
  }: {
    emailAddress: string
    password: string
    mode: AUTH_MODE
  },
  onSuccessfulAuthentication?: (userCredential: UserCredential, mode: AUTH_MODE) => Promise<void>
): Promise<BackgroundAuthenticationReturnable> => {
  try {
    const { status, payload } = await new Promise<BackgroundAuthenticationReturnable>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.AUTH.AUTHENTICATE,
          payload: {
            emailAddress,
            password,
            mode,
          }
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) {
      if (onSuccessfulAuthentication) await onSuccessfulAuthentication(
        payload.userCredential,
        mode,
      )

      return returnable.success(payload)
    } else {
      return returnable.fail(payload)
    }
  } catch (error) {
    logError({
      functionName: 'authenticateWithEmailAndPassword',
      data: {
        emailAddress,
        password,
        mode,
      },
      error,
    })

    return returnable.fail({
      isSuccessful: false,
      shouldRetry: true,
      toast: {
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      },
    })
  }
}

/**
 * Authenticate the user with Google.
 */
export const authenticateWithGoogle = async () => {
  try {
    const { status, payload } = await new Promise<BackgroundAuthenticationWithGoogleReturnable>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.AUTH.AUTHENTICATE_WITH_GOOGLE,
          payload: null,
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) {
      return returnable.success(payload)
    } else {
      return returnable.fail(payload)
    }
  } catch (error) {
    logError({
      functionName: 'authenticateWithGoogle',
      data: null,
      error,
    })

    return returnable.fail(error as Error)
  }
}

/**
 * Get the current user.
 */
export const getCurrentUser = async (): Promise<Returnable<User & RealtimeDatabaseUser | null, Error>> => {
  try {
    const { status, payload } = await new Promise<Returnable<User & RealtimeDatabaseUser | null, Error>>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: INTERNAL_MESSAGE_ACTIONS.AUTH.GET_CURRENT_USER,
          payload: null
        },
        response => {
          if (response.status) resolve(response)
          else reject(response)
        }
      )
    })

    if (status) {
      return returnable.success(payload)
    } else {
      return returnable.fail(payload)
    }
  } catch (error) {
    logError({
      functionName: 'getCurrentUser',
      data: null,
      error,
    })

    return returnable.fail(error as Error)
  }
}
