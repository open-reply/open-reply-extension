// Packages:
import {
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '..'
import { FirebaseError } from 'firebase/app'
import returnable from 'utils/returnable'
import { getRDBUserSnapshot } from '../realtime-database/users/get'
import logError from 'utils/logError'

// Typescript:
import { type UserCredential } from 'firebase/auth'
import type { Returnable } from 'types/index'
import type { Toast } from '../../components/ui/use-toast'

export enum AUTH_MODE {
  LOGIN,
  SIGN_UP,
}

// Functions:
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
  toast: ({ ...props }: Toast) => void,
  onSignUp?: (userCredential: UserCredential) => void,
  onSuccessfulAuthentication?: (userCredential: UserCredential) => void,
): Promise<Returnable<{ userCredential: UserCredential, isSuccessful: boolean, shouldRetry: boolean }, { isSuccessful: boolean, shouldRetry: boolean }>> => {
  try {
    if (mode === AUTH_MODE.LOGIN) {
      const userCredential = await signInWithEmailAndPassword(auth, emailAddress, password)
      toast({
        title: 'Logged in successfully!',
        description: 'Welcome to OpenReply.',
      })
      if (onSuccessfulAuthentication) onSuccessfulAuthentication(userCredential)

      return returnable.success({
        userCredential,
        isSuccessful: true,
        shouldRetry: false
      })
    } else if (mode === AUTH_MODE.SIGN_UP) {
      const userCredential = await createUserWithEmailAndPassword(auth, emailAddress, password)
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to OpenReply.',
      })
      if (onSignUp) onSignUp(userCredential)
      if (onSuccessfulAuthentication) onSuccessfulAuthentication(userCredential)

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
          toast({
            variant: 'destructive',
            title: 'Your account was suspended!',
            description: 'Please contact us to learn more.'
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: true })
        } else if (
          code === AuthErrorCodes.INVALID_EMAIL ||
          code === AuthErrorCodes.INVALID_PASSWORD
        ) {
          toast({
            variant: 'destructive',
            title: 'Invalid email address or password!',
            description: 'Please enter the correct email and password.',
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: true })
        } else if (code === AuthErrorCodes.NEED_CONFIRMATION) {
          toast({
            variant: 'destructive',
            title: 'Please try signing in with Google!',
            description: 'You signed up with Google, please log in with it again.',
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: true })
        } else if (code === AuthErrorCodes.EMAIL_CHANGE_NEEDS_VERIFICATION) {
          toast({
            variant: 'destructive',
            title: 'Please verify your email!',
            description: 'In order to sign in, you need to verify your new email.',
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: true })
        }
      }
    } else if (mode === AUTH_MODE.SIGN_UP) {
      if ((error as FirebaseError).code) {
        const code = (error as FirebaseError).code as typeof AuthErrorCodes[keyof typeof AuthErrorCodes]
        if (code === AuthErrorCodes.EMAIL_EXISTS) {
          // NOTE: How will this ever get triggered?
          toast({
            variant: 'destructive',
            title: 'Email address already in use!',
            description: 'Please try creating an account with a different email address.'
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: false })
        } else if (
          code === AuthErrorCodes.INVALID_EMAIL ||
          code === AuthErrorCodes.INVALID_PASSWORD
        ) {
          toast({
            variant: 'destructive',
            title: 'Invalid email address or password!',
            description: 'Please enter the correct email and password.',
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: true })
        } else if (code === AuthErrorCodes.NEED_CONFIRMATION) {
          toast({
            variant: 'destructive',
            title: 'Please try signing in with Google!',
            description: 'You signed up with Google, please log in with it again.',
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: false })
        } else if (code === AuthErrorCodes.WEAK_PASSWORD) {
          toast({
            variant: 'destructive',
            title: 'Please use a stronger password!',
            description: 'Your current password is weak, please use a stronger one.',
          })

          return returnable.fail({ isSuccessful: false, shouldRetry: true })
        }
      }
    }

    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: "We're currently facing some problems, please try again later!",
    })

    logError({
      functionName: 'authenticateWithEmailAndPassword',
      data: {
        emailAddress,
        password,
        mode,
      },
      error,
    })

    return returnable.fail({ isSuccessful: false, shouldRetry: true })
  }
}

export const authenticateWithGoogle = async (
  toast: ({ ...props }: Toast) => void,
  onSignUp?: (userCredential: UserCredential) => void,
  onSuccessfulAuthentication?: (userCredential: UserCredential) => void,
): Promise<Returnable<UserCredential, unknown>> => {
  try {
    const provider = new GoogleAuthProvider()
    const credential = await signInWithPopup(auth, provider)
    const UID = credential.user.uid

    // NOTE: Check if the user was just created via Google Auth
    const userSnapshot = await getRDBUserSnapshot(UID)
    if (!userSnapshot.status) throw userSnapshot.payload

    if (userSnapshot.payload.exists()) {
      toast({
        title: 'Logged in successfully!',
        description: 'Welcome to OpenReply.',
      })
    } else {
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to OpenReply.',
      })
      if (onSignUp) onSignUp(credential)
    }

    if (onSuccessfulAuthentication) onSuccessfulAuthentication(credential)

    return returnable.success(credential)
  } catch (error) {
    logError({
      functionName: 'authenticateWithGoogle',
      data: null,
      error,
    })
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: "We're currently facing some problems, please try again later!",
    })

    return returnable.fail(error)
  }
}
