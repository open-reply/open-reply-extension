// Constants:
const AUTH = {
  AUTHENTICATE: 'AUTHENTICATE',
  LOGOUT: 'LOGOUT',

  AUTH_STATE: 'AUTH_STATE',
}

const REALTIME_DATABASE = {
  comment: {
    get: {
      isCommentBookmarked: 'isCommentBookmarked',
    },
  },
  muted: {
    get: {
      getAllMutedUsers: 'getAllMutedUsers',
    },
    set: {
      muteUser: 'muteUser',
      unmuteUser: 'unmuteUser',
    },
  },
  recentActivity: {
    get: {
      getRecentActivityFromUser: 'getRecentActivityFromUser',
    },
  },
  reply: {
    get: {
      isReplyBookmarked: 'isReplyBookmarked',
    },
  },
  tastes: {
    get: {
      getUserTaste: 'getUserTaste',
      getUserTopicTasteScore: 'getUserTopicTasteScore',
    },
  },
  topics: {
    get: {
      getTopicCommentScores: 'getTopicCommentScores',
    },
  },
  users: {
    get: {
      getRDBUserSnapshot: 'getRDBUserSnapshot',
      getRDBUser: 'getRDBUser',
      isUsernameTaken: 'isUsernameTaken',
    },
    set: {
      updateRDBUser: 'updateRDBUser',
      updateRDBUsername: 'updateRDBUsername',
      updateRDBUserFullName: 'updateRDBUserFullName',
    },
  },
  website: {
    get: {
      getRDBWebsite: 'getRDBWebsite',
      getRDBWebsiteImpressions: 'getRDBWebsiteImpressions',
      getRDBWebsiteFlagDistribution: 'getRDBWebsiteFlagDistribution',
      getRDBWebsiteFlagDistributionReasonCount: 'getRDBWebsiteFlagDistributionReasonCount',
      getRDBWebsiteFlagsCumulativeWeight: 'getRDBWebsiteFlagsCumulativeWeight',
      getRDBWebsiteFlagCount: 'getRDBWebsiteFlagCount',
      getRDBWebsiteCommentCount: 'getRDBWebsiteCommentCount',
    },
    set: {
      incrementWebsiteImpression: 'incrementWebsiteImpression',
    },
  },
}

// Exports:
export const INTERNAL_MESSAGE_ACTIONS = {
  GENERAL: {
    TAKE_SCREENSHOT: 'TAKE_SCREENSHOT',
  },
  AUTH,
  REALTIME_DATABASE,
}
