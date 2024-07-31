// Constants:
const REALTIME_DATABASE_PATHS = {
  USERS: {
    user: (UID: string) => `users/${ UID }`,
  },
}

// Exports:
export default REALTIME_DATABASE_PATHS
