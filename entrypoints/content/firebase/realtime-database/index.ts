// Packages:
import { database } from '..'
import { child, get, ref } from 'firebase/database'

// Exports:
export const getRDBUserSnapshot = async (UID: string) => await get(child(ref(database), `users/${ UID }`))
