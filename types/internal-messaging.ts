// Typescript:
import type { User } from 'firebase/auth'
import type { RealtimeDatabaseUser } from './realtime.database'

// Exports:
export enum SubscriptionType {
  Notifications = 'Notifications',
  AuthState = 'AuthState',
}

export interface AuthStateBroadcastPayload {
  isLoading: boolean
  isSignedIn?: boolean
  isAccountFullySetup?: boolean
  user: (User & RealtimeDatabaseUser) | null
  toast?: {
    title?: string
    description?: string
    variant?: 'destructive' | 'default'
  }
}
