// Constants:
const REALTIME_DATABASE_SCHEMA = {
  USERS: {
    user: (UID: string) => `users/${ UID }`,
  },
}

// Exports:
export default REALTIME_DATABASE_SCHEMA
