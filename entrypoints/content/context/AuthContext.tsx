// Packages:
import React, { createContext, useState, useEffect } from 'react'
import { useToast } from '../components/ui/use-toast'

// Typescript:
import { type User } from 'firebase/auth'
import { type RealtimeDatabaseUser } from 'types/realtime.database'
import type { AuthStateBroadcastPayload } from 'types/internal-messaging'

export interface AuthContextType {
  isLoading: boolean
  isSignedIn: boolean
  isAccountFullySetup: boolean
  user: (User & RealtimeDatabaseUser) | null
}

export const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isSignedIn: false,
  isAccountFullySetup: false,
  user: null
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

  // Effects:
  useEffect(() => {
    chrome.runtime.onMessage.addListener(request => {
      if (
        request.type === INTERNAL_MESSAGE_ACTIONS.AUTH.AUTH_STATE_CHANGED &&
        request.payload
      ) {
        const payload = request.payload as AuthStateBroadcastPayload
        if (payload.isLoading !== undefined) setIsLoading(payload.isLoading)
        if (payload.isSignedIn !== undefined) setIsSignedIn(payload.isSignedIn)
        if (payload.isAccountFullySetup !== undefined) setIsAccountFullySetup(payload.isAccountFullySetup)
        if (payload.user !== undefined) setUser(payload.user)
        if (payload.toast !== undefined) toast(payload.toast)
      }
    })
    
  }, [chrome, toast])

  // Return:
  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isSignedIn,
        isAccountFullySetup,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
