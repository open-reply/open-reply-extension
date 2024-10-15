// Packages:
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'

// Declarations:
initializeApp()

// Exports:
export const firestore = getFirestore()
export const database = getDatabase()
export const auth = getAuth()
