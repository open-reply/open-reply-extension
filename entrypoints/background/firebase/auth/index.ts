// Packages:
import {
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../index'
import { FirebaseError } from 'firebase/app'
import returnable from 'utils/returnable'
import { _getRDBUserSnapshot } from '../realtime-database/users/get'
import logError from 'utils/logError'

// Typescript:
import { type UserCredential } from 'firebase/auth'
import type { Returnable } from 'types/index'
import { AUTH_MODE } from 'types/auth'

// Functions:
/**
 * Authenticate the user with email address and password, handles either login or signup.
 */
export const _authenticateWithEmailAndPassword = async (
  {
    emailAddress,
    password,
    mode,
  }: {
    emailAddress: string
    password: string
    mode: AUTH_MODE
  },
): Promise<Returnable<{
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
  }>> => {
  try {
    if (mode === AUTH_MODE.LOGIN) {
      const userCredential = await signInWithEmailAndPassword(auth, emailAddress, password)

      return returnable.success({
        userCredential,
        isSuccessful: true,
        shouldRetry: false
      })
    } else if (mode === AUTH_MODE.SIGN_UP) {
      const userCredential = await createUserWithEmailAndPassword(auth, emailAddress, password)

      return returnable.success({
        userCredential,
        isSuccessful: true,
        shouldRetry: false
      })
    } else {
      throw new Error('Invalid authentication mode!')
    }
  } catch (error) {
    if (mode === AUTH_MODE.LOGIN) {
      if ((error as FirebaseError).code) {
        const code = (error as FirebaseError).code as typeof AuthErrorCodes[keyof typeof AuthErrorCodes]
        if (code === AuthErrorCodes.USER_DELETED) {
          // NOTE: User does not exist. Move to createUser flow.
          return returnable.fail({ isSuccessful: false, shouldRetry: false })
        } else if (
          code === AuthErrorCodes.USER_CANCELLED ||
          code === AuthErrorCodes.USER_DISABLED
        ) {
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: true,
            toast: {
              title: 'Your account was suspended!',
              description: 'Please contact us to learn more.'
            },
          })
        } else if (
          code === AuthErrorCodes.INVALID_EMAIL ||
          code === AuthErrorCodes.INVALID_PASSWORD
        ) {
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: true,
            toast: {
              title: 'Invalid email address or password!',
              description: 'Please enter the correct email and password.',
            },
          })
        } else if (code === AuthErrorCodes.NEED_CONFIRMATION) {
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: true,
            toast: {
              title: 'Please try signing in with Google!',
              description: 'You signed up with Google, please log in with it again.',
            },
          })
        } else if (code === AuthErrorCodes.EMAIL_CHANGE_NEEDS_VERIFICATION) {
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: true,
            toast: {
              title: 'Please verify your email!',
              description: 'In order to sign in, you need to verify your new email.',
            },
          })
        }
      }
    } else if (mode === AUTH_MODE.SIGN_UP) {
      if ((error as FirebaseError).code) {
        const code = (error as FirebaseError).code as typeof AuthErrorCodes[keyof typeof AuthErrorCodes]
        if (code === AuthErrorCodes.EMAIL_EXISTS) {
          // NOTE: How will this ever get triggered?
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: false,
            toast: {
              title: 'Email address already in use!',
              description: 'Please try creating an account with a different email address.'
            },
          })
        } else if (
          code === AuthErrorCodes.INVALID_EMAIL ||
          code === AuthErrorCodes.INVALID_PASSWORD
        ) {
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: true,
            toast: {
              title: 'Invalid email address or password!',
              description: 'Please enter the correct email and password.',
            },
          })
        } else if (code === AuthErrorCodes.NEED_CONFIRMATION) {
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: false,
            toast: {
              title: 'Please try signing in with Google!',
              description: 'You signed up with Google, please log in with it again.',
            },
          })
        } else if (code === AuthErrorCodes.WEAK_PASSWORD) {
          return returnable.fail({
            isSuccessful: false,
            shouldRetry: true,
            toast: {
              title: 'Please use a stronger password!',
              description: 'Your current password is weak, please use a stronger one.',
            },
          })
        }
      }
    }

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
 * Note: There are issues and confusion with how MV3 handles popups for sign-ins. This feature may end up being temporarily parked.
 */
// export const authenticateWithGoogle = async ({
//   toast,
//   onSignUp,
//   onSuccessfulAuthentication,
// }: {
//   toast: ({ ...props }: Toast) => void
//   onSignUp?: (userCredential: UserCredential) => void
//   onSuccessfulAuthentication?: (userCredential: UserCredential) => void
// }): Promise<Returnable<UserCredential, unknown>> => {
//   try {
//     const provider = new GoogleAuthProvider()
//     const credential = await signInWithPopup(auth, provider)
//     const UID = credential.user.uid

//     // NOTE: Check if the user was just created via Google Auth
//     const userSnapshot = await getRDBUserSnapshot(UID)
//     if (!userSnapshot.status) throw userSnapshot.payload

//     if (userSnapshot.payload.exists()) {
//       toast({
//         title: 'Logged in successfully!',
//         description: 'Welcome to OpenReply.',
//       })
//     } else {
//       toast({
//         title: 'Account created successfully!',
//         description: 'Welcome to OpenReply.',
//       })
//       if (onSignUp) onSignUp(credential)
//     }

//     if (onSuccessfulAuthentication) onSuccessfulAuthentication(credential)

//     return returnable.success(credential)
//   } catch (error) {
//     logError({
//       functionName: 'authenticateWithGoogle',
//       data: null,
//       error,
//     })
//     toast({
//       variant: 'destructive',
//       title: 'Uh oh! Something went wrong.',
//       description: "We're currently facing some problems, please try again later!",
//     })

//     return returnable.fail(error)
//   }
// }
