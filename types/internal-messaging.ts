import { User } from "firebase/auth"
import { RealtimeUserVerificationStatus } from "./user"

// Exports:
export enum SubscriptionType {
  Notifications = 'Notifications',
  AuthState = 'AuthState',
}

export interface AuthStateBroadcastPayload {
  isLoading: boolean
  isSignedIn?: boolean
  isAccountFullySetup?: boolean
  user: (User & {
    username?: string
    fullName?: string
    verification?: RealtimeUserVerificationStatus
    photoURL: string | null
  }) | null
  toast?: {
    title?: string
    description?: string
    variant?: 'destructive' | 'default'
  }
}
