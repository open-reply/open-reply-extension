// Constants:
const FIRESTORE_DATABASE_PATHS = {
  USERS: {
    INDEX: 'users',
  },
  WEBSITES: {
    INDEX: 'websites',
    COMMENTS: {
      INDEX: 'comments',
      REPLIES: {
        INDEX: 'replies',
      }
    }
  },
  REPORTS: {
    INDEX: 'reports',
  },
}

// Exports:
export default FIRESTORE_DATABASE_PATHS
