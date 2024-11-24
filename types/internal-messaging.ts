// Typescript:
import type { User } from 'firebase/auth'
import type { RealtimeDatabaseUser } from './realtime.database'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

// Exports:
export enum SubscriptionType {
  Notifications = 'Notifications',
  AuthState = 'AuthState',
}

export interface SubscriptionUnit {
  tabIDs: Set<number>
  unsubscribe: () => void
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

export interface LastVisibleInstance {
  snapshot: QueryDocumentSnapshot<DocumentData, DocumentData> | null
  id: string | null
  reachedEnd: boolean
}

export interface LastVisible {
  [tabID: number]: {
    [functionType: string]: LastVisibleInstance
  }
}

export enum NotificationSubtype {
  NEW_NOTIFICATION_COUNT,
  ALL_NOTIFICATIONS_HAVE_BEEN_READ,
}
