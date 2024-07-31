// Packages:
import { firestore } from '../..'
import { doc, getDoc } from 'firebase/firestore'
import returnable from '@/entrypoints/content/utils/returnable'
import logError from '@/entrypoints/content/utils/logError'

// Typescript:
import type { Returnable } from '@/entrypoints/content/types'
import type { DocumentData, DocumentSnapshot } from 'firebase/firestore'

// Constants:
import FIRESTORE_DATABASE_PATHS from '../paths'

// Exports:
export const getFirestoreUserSnapshot = async (UID: string): Promise<Returnable<DocumentSnapshot<DocumentData, DocumentData>, Error>> => {
  try {
    return returnable.success(await getDoc(doc(firestore, FIRESTORE_DATABASE_PATHS.USERS.INDEX, UID)))
  } catch (error) {
    logError({
      functionName: 'getFirestoreUserSnapshot',
      data: UID,
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
