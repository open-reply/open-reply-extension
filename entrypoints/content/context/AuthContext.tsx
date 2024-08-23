// Packages:
import React, { createContext, useState, useEffect } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useToast } from '../components/ui/use-toast'
import { getRDBUser } from '../firebase/realtime-database/users/get'

// Typescript:
import { type User } from 'firebase/auth'
import { type RealtimeDatabaseUser } from 'types/realtime.database'

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
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const UID = user.uid        
        const { status, payload } = await getRDBUser(UID)
        
        if (
          status &&
          payload !== null &&
          payload.username
        ) {
          setIsAccountFullySetup(true)
          const photoURL = user.photoURL ? user.photoURL : null
          
          setUser({
            ...user,
            username: payload.username,
            fullName: payload.fullName,
            verification: payload.verification,
            photoURL,
          })
          setIsSignedIn(true)
        } else {
          setIsAccountFullySetup(false)
          toast({
            title: 'Please finish setting up your profile!',
          })
          setIsSignedIn(true)
        }
      } else {
        setUser(null)
        setIsSignedIn(false)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [toast])

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
