// Packages:
import { initializeApp } from 'firebase/app'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getMessaging } from 'firebase/messaging'

// Constants:
const firebaseConfig = {
  apiKey: 'AIzaSyDJTJA-fcRm7BfYnWBK6yRo4dk1WDbR364',
  authDomain: 'openreply-app.firebaseapp.com',
  projectId: 'openreply-app',
  storageBucket: 'openreply-app.appspot.com',
  messagingSenderId: '217460725135',
  appId: '1:217460725135:web:57fac2ab07055f4b69a7fa',
  measurementId: 'G-0PPE9PPX7L'
}

// Exports:
export const app = initializeApp(firebaseConfig)
export const functions = getFunctions(app)
export const firestore = getFirestore(app)
export const database = getDatabase(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const messaging = getMessaging(app)

// NOTE: Enable during development.
connectFunctionsEmulator(functions, 'localhost', 5001)
