// Packages:
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { UserCredential } from 'firebase/auth'
import type { Returnable } from 'types'
import { AUTH_MODE } from 'types/auth'

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
