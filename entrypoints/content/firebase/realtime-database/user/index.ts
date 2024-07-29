// Packages:
import { database } from '../..'
import { child, get, ref } from 'firebase/database'
import returnable from '@/entrypoints/content/utils/returnable'
import logError from '@/entrypoints/content/utils/logError'

// Typescript:
import type { Returnable } from '@/entrypoints/content/types'
import type { DataSnapshot } from 'firebase/database'

// Exports:
export const getRDBUserSnapshot = async (UID: string): Promise<Returnable<DataSnapshot, Error>> => {
  try {
    return returnable.success(await get(child(ref(database), `users/${ UID }`)))
  } catch (error) {
    logError({
      functionName: 'getRDBUserSnapshot',
      data: UID,
      error: error,
    })

    return returnable.fail(error as unknown as Error)
  }
}
