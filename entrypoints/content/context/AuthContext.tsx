// Packages:
import React, { createContext, useState, useEffect } from 'react'
import { useToast } from '../components/ui/use-toast'
import {
  getAuthState,
  logout,
  sendVerificationEmail,
} from '../firebase/auth'

// Typescript:
import { type User } from 'firebase/auth'
import { type RealtimeDatabaseUser } from 'types/realtime.database'
import type { AuthStateBroadcastPayload } from 'types/internal-messaging'
import type { Returnable } from 'types/index'

export interface AuthContextType {
  isLoading: boolean
  isSignedIn: boolean
  isAccountFullySetup: boolean
  user: (User & RealtimeDatabaseUser) | null
  isEmailVerified: boolean
  handleLogout: () => Promise<Returnable<null, Error>>
  handleSendVerificationEmail: () => Promise<Returnable<null, Error>>
  syncAuthState: () => Promise<Returnable<null, Error>>
}

export const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isSignedIn: false,
  isAccountFullySetup: false,
  user: null,
  isEmailVerified: false,
  handleLogout: async () => returnable.fail(new Error('AuthContext is not yet initialized!')),
  handleSendVerificationEmail: async () => returnable.fail(new Error('AuthContext is not yet initialized!')),
  syncAuthState: async () => returnable.fail(new Error('AuthContext is not yet initialized!')),
})

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const { toast } = useToast()

  // State:
  const [isLoading, setIsLoading] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isAccountFullySetup, setIsAccountFullySetup] = useState(false)
  const [user, setUser] = useState<(User & RealtimeDatabaseUser) | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState(false)

  // Functions:
  const handleAuthState = (payload: AuthStateBroadcastPayload) => {
    if (payload.isLoading !== undefined) setIsLoading(payload.isLoading)
    if (payload.isSignedIn !== undefined) setIsSignedIn(payload.isSignedIn)
    if (payload.isAccountFullySetup !== undefined) setIsAccountFullySetup(payload.isAccountFullySetup)
    if (payload.user !== undefined) {
      setUser(payload.user)
      setIsEmailVerified(!!payload.user?.emailVerified)
    }
    if (payload.toast !== undefined) toast(payload.toast)
  }

  const handleLogout = async (): Promise<Returnable<null, Error>> => {
    try {
      const { status, payload } = await logout()
      if (!status) throw payload

      return returnable.success(null)
    } catch (error) {
      logError({
        functionName: 'AuthContext.handleLogout',
        data: null,
        error,
      })

      return returnable.fail(error as unknown as Error)
    }
  }

  const handleSendVerificationEmail = async (): Promise<Returnable<null, Error>> => {
    try {
      const { status, payload } = await sendVerificationEmail()
      if (!status) throw payload

      return returnable.success(null)
    } catch (error) {
      logError({
        functionName: 'AuthContext.handleSendVerificationEmail',
        data: null,
        error,
      })

      return returnable.fail(error as unknown as Error)
    }
  }

  const syncAuthState = async (): Promise<Returnable<null, Error>> => {
    try {
      const { status, payload } = await getAuthState()
      if (!status) throw payload
      
      handleAuthState(payload)
      return returnable.success(null)
    } catch (error) {
      logError({
        functionName: 'AuthContext.useEffect[0]',
        data: null,
        error,
      })
      
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })

      return returnable.fail(error as unknown as Error)
    }
  }

  // Effects:
  useEffect(() => {
    syncAuthState()

    chrome.runtime.onMessage.addListener(request => {
      if (
        request.type === INTERNAL_MESSAGE_ACTIONS.AUTH.AUTH_STATE_CHANGED &&
        request.payload
      ) handleAuthState(request.payload)
    })
  }, [])

  // Return:
  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isSignedIn,
        isAccountFullySetup,
        user,
        isEmailVerified,
        handleLogout,
        handleSendVerificationEmail,
        syncAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
