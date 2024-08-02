// Typescript:
import type { URLHash, WebsiteFlagReason } from 'types/websites'

// Exports:
export const FIRESTORE_DATABASE_PATHS = {
  USERS: {
    INDEX: 'users',
  },
  WEBSITES: {
    INDEX: 'websites',
    COMMENTS: {
      INDEX: 'comments',
      REPLIES: {
        INDEX: 'replies',
      },
    },
    FLAGS: {
      INDEX: 'flags'
    }
  },
  REPORTS: {
    INDEX: 'reports',
  },
}

export const REALTIME_DATABASE_PATHS = {
  USERS: {
    user: (UID: string) => `users/${ UID }`,
    username: (UID: string) => `users/${ UID }/username`,
    fullName: (UID: string) => `users/${ UID }/fullName`,
  },
  USERNAMES: {
    UID: (username: string) => `usernames/${ username }`,
  },
  VOTES: {

  },
  WEBSITES: {
    website: (URLHash: URLHash) => `websites/${ URLHash }`,
    impressions: (URLHash: URLHash) => `websites/${ URLHash }/impressions`,
    flagInfo: (URLHash: URLHash) => `websites/${ URLHash }/flagInfo`,
    flagDistribution: (URLHash: URLHash) => `websites/${ URLHash }/flagInfo/flagDistribution`,
    flagDistributionReasonCount: (URLHash: URLHash, flagReason: WebsiteFlagReason) => `websites/${ URLHash }/flagInfo/flagDistribution/${ flagReason }`,
    flagsCumulativeWeight: (URLHash: URLHash) => `websites/${ URLHash }/flagInfo/flagsCumulativeWeight`,
    flagCount: (URLHash: URLHash) => `websites/${ URLHash }/flagInfo/flagCount`,
  },
}
