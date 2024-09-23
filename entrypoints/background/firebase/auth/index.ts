// Packages:
import {
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  User,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signOut,
} from 'firebase/auth'
import { auth } from '../index'
import { FirebaseError } from 'firebase/app'
import returnable from 'utils/returnable'
import { _getRDBUser, _getRDBUserSnapshot } from '../realtime-database/users/get'
import logError from 'utils/logError'
import { browser, Manifest } from 'webextension-polyfill-ts'
import { _createRDBUser } from '../realtime-database/users/set'

// Typescript:
import { type UserCredential } from 'firebase/auth'
import type { Returnable } from 'types/index'
import { AUTH_MODE } from 'types/auth'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import type { AuthStateBroadcastPayload } from 'types/internal-messaging'

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
      const { status, payload } = await _createRDBUser()
      if (!status) throw payload

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
 * Handles authentication with Google.
 */
export const _authenticateWithGoogle = async (): Promise<Returnable<{
  user: User & RealtimeDatabaseUser
  toast?: {
    title: string
    description: string
  }
}, Error>> => {
  try {
    let toast
    const {
      status: googleSignInStatus,
      payload: googleSignInPayload,
    } = await _googleSignIn()
    if (!googleSignInStatus) throw googleSignInPayload

    // Check if the user was just created via Google Auth
    const UID = googleSignInPayload.uid
    const {
      status: userSnapshotStatus,
      payload: userSnapshotPayload,
    } = await _getRDBUserSnapshot(UID)
    if (!userSnapshotStatus) throw userSnapshotPayload

    if (userSnapshotPayload.exists()) {
      toast = {
        title: 'Logged in successfully!',
        description: 'Welcome to OpenReply.',
      }
    } else {
      const { status, payload } = await _createRDBUser()
      if (!status) throw payload

      toast = {
        title: 'Account created successfully!',
        description: 'Welcome to OpenReply.',
      }
    }

    return returnable.success({ user: googleSignInPayload, toast })
  } catch (error) {
    logError({
      functionName: '_authenticateWithGoogle',
      data: null,
      error,
    })

    return returnable.fail(error as Error)
  }
}

/**
 * The underlying function that handles Google Authentication.
 */
export const _googleSignIn = async (): Promise<Returnable<(User & RealtimeDatabaseUser), Error>> => {
  try {
    const {
      status: getCurrentUserStatus,
      payload: getCurrentUserPayload,
    } = await _getCurrentUser()

    if (!getCurrentUserStatus) throw getCurrentUserPayload
    else if (getCurrentUserPayload) return returnable.success(getCurrentUserPayload)
  
    /**
    * Use Web Auth Flow instead of Chrome Identity to support Edge and Opera
    * and also because Chrome Identity sometimes becomes stale, requiring a browser restart.
    */
    // const token = await getChromeIdentity()
    const {
      status: getAuthTokenViaWebAuthFlowStatus,
      payload: getAuthTokenViaWebAuthFlowPayload,
    } = await _getAuthTokenViaWebAuthFlow()
    if (!getAuthTokenViaWebAuthFlowStatus) throw getAuthTokenViaWebAuthFlowPayload

    const {
      status: googleSignInStatus,
      payload: googleSignInPayload,
    } = await _googleSignInWithToken(getAuthTokenViaWebAuthFlowPayload)
    if (!googleSignInStatus) throw googleSignInPayload

    const googleUser = googleSignInPayload
    let _user = googleUser as User & RealtimeDatabaseUser

    const UID = _user.uid        
    const photoURL = _user.photoURL ? _user.photoURL : null
    const {
      status: getRDBUserStatus,
      payload: getRDBUserPayload,
    } = await _getRDBUser({ UID })

    if (getRDBUserStatus) {
      _user = {
        ..._user,
        username: getRDBUserPayload?.username,
        fullName: getRDBUserPayload?.fullName,
        verification: getRDBUserPayload?.verification,
        photoURL,
      }
    }

    return returnable.success(_user)
  } catch (error) {
    console.warn(`Firebase: Error signing in with Google`, error)
    const message: string = (error as Error)?.message || (error as string)
    if (
      message !== 'The user did not approve access.' &&
      message !== 'OAuth2 not granted or revoked.' &&
      message !== 'Authorization page could not be loaded.'
    ) {
      console.error(message)
      // Sentry.captureMessage(`googleSignIn problem: ${message}`)
    }

    logError({
      functionName: '_googleSignIn',
      data: null,
      error,
    })
    
    return returnable.fail(error as Error)
  }
}

/**
 * Uses `browser.identity` to get Auth Token via Web Auth Flow.
 */
export const _getAuthTokenViaWebAuthFlow = async (): Promise<Returnable<string, Error>> => {
  try {
    let authURL
    const redirectURL = browser.identity.getRedirectURL('oauth2')
    console.log(redirectURL, browser.runtime.getManifest())
    const { oauth2 } = browser.runtime.getManifest() as Manifest.ManifestBase & {
      oauth2: { client_id: string }
    }
    const clientId = oauth2.client_id
    const authParams = new URLSearchParams({
      client_id: clientId,
      response_type: 'token',
      redirect_uri: redirectURL,
      scope: ['email', 'profile'].join(' '),
    })
    authURL = `https://accounts.google.com/o/oauth2/auth?${authParams.toString()}`
    console.info('Firebase: Launching Web Auth Flow with Auth URL', authURL)
    const responseUrl = await browser.identity.launchWebAuthFlow({
      url: authURL,
      interactive: true,
    })
    const url = new URL(responseUrl)
    const urlParams = new URLSearchParams(url.hash.slice(1))
    const {
      access_token: token,
      token_type: tokenType,
      expires_in: expiresIn,
    } = Object.fromEntries(urlParams.entries())
    console.debug(
      'Firebase: Got %s access token %s from Web Auth Flow, expires in %s',
      tokenType,
      token,
      expiresIn
    )
    await browser.storage.local.set({ token })
    return returnable.success(token)
  } catch (error) {
    console.warn(`Firebase: Error getting token from webAuthFlow`, error)
    const message: string = (error as Error)?.message || (error as string)
    if (message !== 'The user did not approve access.' && message !== 'OAuth2 not granted or revoked.') {
      // Sentry.captureException(error, {
      //   extra: {
      //     errorMessage: `Error opening authorization page ${authURL}`,
      //   },
      // })
      console.error(message)
    }
    
    logError({
      functionName: '_getAuthTokenViaWebAuthFlow',
      data: null,
      error,
    })
    
    return returnable.fail(error as Error)
  }
}

/**
 * Sign in to Google with token.
 */
export const _googleSignInWithToken = async (token: string): Promise<Returnable<User, Error>> => {
  console.log('Starting Google Sign-In with Token', token)
  try {
    /**
     * NOTE: DO NOT SET PERSISTENCE: it causes a ReferenceError: window is not defined
     * https://firebase.google.com/docs/auth/web/auth-state-persistence
     * See https://github.com/firebase/firebase-js-sdk/issues/2903
     */
    // await setPersistence(auth, browserLocalPersistence)
    const oAuthCredential = GoogleAuthProvider.credential(null, token)

    // Sign in to Firebase with the OAuth Access Token
    const credential: UserCredential = await signInWithCredential(auth, oAuthCredential)
    console.log('Firebase: Google Sign-In with Token Success', credential)

    return returnable.success(credential.user)
  } catch (error) {
    console.warn(`Firebase: Error signing in with token`, error)
    const message: string = (error as Error)?.message || (error as string)
    // Sentry.captureMessage(`googleSignInWithToken problem: ${message}`)
    
    logError({
      functionName: '_googleSignInWithToken',
      data: token,
      error,
    })
    
    return returnable.fail(error as Error)
  }
}

/**
 * Get the current user.
 */
export const _getCurrentUser = async (): Promise<Returnable<User & RealtimeDatabaseUser | null, Error>> => {
  try {
    const user: (User & RealtimeDatabaseUser) | null = await new Promise(async (resolve, reject) => {
      const { currentUser } = auth
      if (currentUser) {
        let _user = currentUser as (User & RealtimeDatabaseUser) | null

        if (_user) {
          const UID = _user.uid        
          const photoURL = _user.photoURL ? _user.photoURL : null
          const { status, payload } = await _getRDBUser({ UID })

          if (status) {
            _user = {
              ..._user,
              username: payload?.username,
              fullName: payload?.fullName,
              verification: payload?.verification,
              photoURL,
            }
          }
        }

        resolve(_user)
      } else {
        const unsubscribe = onAuthStateChanged(
          auth,
          async user => {
            let _user = user as (User & RealtimeDatabaseUser) | null

            if (_user) {
              const UID = _user.uid        
              const photoURL = _user.photoURL ? _user.photoURL : null
              const { status, payload } = await _getRDBUser({ UID })

              if (status) {
                _user = {
                  ..._user,
                  username: payload?.username,
                  fullName: payload?.fullName,
                  verification: payload?.verification,
                  photoURL,
                }
              }
            }

            unsubscribe()
            resolve(_user)
          },
          reject
        )
      }
    })
    
    return returnable.success(user)
  } catch (error) {
    logError({
      functionName: '_getCurrentUser',
      data: null,
      error,
    })

    return returnable.fail(error as Error)
  }
}

/**
 * Handle Google sign out.
 */
const _googleSignOut = async (): Promise<Returnable<null, Error>> => {
  console.log('Firebase: Starting Google Sign-Out')
  try {
    await signOut(auth)
    console.log('Firebase: Google Sign-Out Success')
    const token = await browser.storage.local.get('token')
    chrome.identity.removeCachedAuthToken(
      { token: token.token },
      () => console.log('Firebase: Cleared cached auth token'),
    )
    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_googleSignOut',
      data: null,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

/**
 * Get the current auth state.
 */
export const _getAuthState = async (): Promise<Returnable<AuthStateBroadcastPayload, Error>> => {
  const authStateChangedPayload = {
    isLoading: false,
  } as AuthStateBroadcastPayload
  try {
    const user = auth.currentUser
    if (user) {
      const UID = user.uid        
      const photoURL = user.photoURL ? user.photoURL : null
      const { status, payload } = await _getRDBUser({ UID })

      if (status) {
        if (
          payload !== null &&
          payload.username &&
          payload.fullName
        ) {
          authStateChangedPayload.isAccountFullySetup = true
          authStateChangedPayload.user = {
            ...user,
            username: payload.username,
            fullName: payload.fullName,
            verification: payload.verification,
            photoURL,
          }
          authStateChangedPayload.isSignedIn = true
        } else {
          authStateChangedPayload.isAccountFullySetup = false
          authStateChangedPayload.user = {
            ...user,
            username: payload?.username,
            fullName: payload?.fullName,
            verification: payload?.verification,
            photoURL,
          }
          authStateChangedPayload.toast = {
            title: 'Please finish setting up your profile!',
          }
          authStateChangedPayload.isSignedIn = true
        }
      } else {
        authStateChangedPayload.isAccountFullySetup = false
        authStateChangedPayload.user = {
          ...user,
          photoURL,
        }
        authStateChangedPayload.toast = {
          title: 'Please finish setting up your profile!',
        }
        authStateChangedPayload.isSignedIn = true
      }
    } else {
      authStateChangedPayload.user = null
      authStateChangedPayload.isSignedIn = false
    }

    return returnable.success(authStateChangedPayload)
  } catch (error) {
    logError({
      functionName: '_getAuthState',
      data: null,
      error,
    })

    return returnable.fail(error as Error)
  }
}

/**
 * Log out the current user.
 */
export const _logout = async (): Promise<Returnable<null, Error>> => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User is already logged out!')
    if (user.providerId.length === 0) throw new Error('User has no linked providers!')

    const providerID = user.providerData[0].providerId
    switch (providerID) {
      case 'google.com':
        const {
          status: googleSignOutStatus,
          payload: googleSignOutPayload,
        } = await _googleSignOut()
        if (!googleSignOutStatus) throw googleSignOutPayload
        break
      case 'password':
        await signOut(auth)
        break
      default:
        throw new Error('Unknown provider, could not log out!')
    }

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_logout',
      data: null,
      error,
    })

    return returnable.fail(error as Error)
  }
}

/**
 * Send verification email to the user's email address.
 */
export const _sendVerificationEmail = async (): Promise<Returnable<null, Error>> => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User is logged out!')

    await sendEmailVerification(user)

    return returnable.success(null)
  } catch (error) {
    logError({
      functionName: '_sendVerificationEmail',
      data: null,
      error,
    })

    return returnable.fail(error as Error)
  }
}
