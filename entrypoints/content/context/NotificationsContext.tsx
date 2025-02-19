// Packages:
import React, { createContext, useState } from 'react'
import logError from 'utils/logError'
import {
  listenForNotifications, 
  unsubscribeToNotifications,
} from '@/entrypoints/content/firebase/firestore-database/users/get'
import { useToast } from '../components/ui/use-toast'
import useAuth from '../hooks/useAuth'

// Typescript:
import { getUnreadNotificationsCount } from '../firebase/realtime-database/notifications/get'

export interface NotificationsContextType {
  unreadNotificationCount: number | null
}

// Context:
export const NotificationsContext = createContext<NotificationsContextType>({
  unreadNotificationCount: null,
})

// Exports:
export const NotificationsContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const {
    isLoading,
    isSignedIn,
    isAccountFullySetup,
  } = useAuth()
  const { toast } = useToast()
  
  // State:
  const [isListeningForNotifications, setIsListeningForNotifications] = useState(false)
  const [hasGottenUnreadNotificationsCount, setHasGottenUnreadNotificationsCount] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number | null>(null)

  // Functions:
  const _getUnreadNotificationsCount = async () => {
    try {
      setHasGottenUnreadNotificationsCount(true)
      const {
        status,
        payload,
      } = await getUnreadNotificationsCount()
      if (!status) throw payload

      setUnreadNotificationCount(payload)
    } catch (error) {
      setHasGottenUnreadNotificationsCount(false)
      logError({
        functionName: 'NotificationsContextProvider._listenForNotifications',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Unable to fetch unread notification count!',
        description: 'Something went wrong while trying to check for new notifications.',
      })
    }
  }

  const _listenForNotifications = async () => {
    try {
      setIsListeningForNotifications(true)
      const {
        status,
        payload,
      } = await listenForNotifications(
        async unreadCount => setUnreadNotificationCount(unreadCount),
        () => setUnreadNotificationCount(0),
      )
      if (!status) throw payload
    } catch (error) {
      setIsListeningForNotifications(false)

      logError({
        functionName: 'NotificationsContextProvider._listenForNotifications',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Unable to fetch the latest notifications!',
        description: 'Something went wrong while trying to listen for new notifications.',
      })
    }
  }

  const _unsubscribeToNotifications = async () => {
    try {
      const {
        status,
        payload,
      } = await unsubscribeToNotifications()
      if (!status) throw payload
    } catch (error) {
      logError({
        functionName: 'NotificationsContextProvider._unsubscribeToNotifications',
        data: null,
        error,
      })
    }
  }

  // Effects:
  useEffect(() => {
    if (
      !isLoading &&
      isSignedIn &&
      isAccountFullySetup
    ) {
      if (!isListeningForNotifications) _listenForNotifications()
      if (!hasGottenUnreadNotificationsCount) _getUnreadNotificationsCount()
    }

    return () => {
      if (isListeningForNotifications) _unsubscribeToNotifications()
    }
  }, [
    isLoading,
    isSignedIn,
    isAccountFullySetup,
    isListeningForNotifications,
    hasGottenUnreadNotificationsCount,
  ])

  // Return:
  return (
    <NotificationsContext.Provider
      value={{
        unreadNotificationCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
