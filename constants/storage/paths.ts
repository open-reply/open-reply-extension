// Typescript:
import type { UID } from 'types/user'

// Constants:
const STORAGE_PATHS = {
  USERS: {
    profilePicture: (UID: UID) => `users/${ UID }.png`,
  },
}

// Exports:
export default STORAGE_PATHS
