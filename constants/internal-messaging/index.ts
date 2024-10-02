// Constants:
const AUTH = {
  AUTHENTICATE: 'AUTHENTICATE',
  AUTHENTICATE_WITH_GOOGLE: 'AUTHENTICATE_WITH_GOOGLE',
  LOGOUT: 'LOGOUT',
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  GET_CURRENT_USER: 'GET_CURRENT_USER',
  GET_AUTH_STATE: 'GET_AUTH_STATE',
  SEND_VERIFICATION_EMAIL: 'SEND_VERIFICATION_EMAIL',
}

const FIRESTORE_DATABASE = {
  comment: {
    get: {
      getComments: 'getComments',
      getUserComments: 'getUserComments',
      getComment: 'getComment',
      checkCommentForHateSpeech: 'checkCommentForHateSpeech',
    },
    set: {
      addComment: 'addComment',
      deleteComment: 'deleteComment',
      editComment: 'editComment',
      reportComment: 'reportComment',
      upvoteComment: 'upvoteComment',
      downvoteComment: 'downvoteComment',
      notInterestedInComment: 'notInterestedInComment',
      bookmarkComment: 'bookmarkComment',
    },
  },
  reply: {
    get: {
      getReplies: 'getReplies',
      getUserReplies: 'getUserReplies',
      getReply: 'getReply',
      checkReplyForHateSpeech: 'checkReplyForHateSpeech',
    },
    set: {
      addReply: 'addReply',
      deleteReply: 'deleteReply',
      editReply: 'editReply',
      reportReply: 'reportReply',
      upvoteReply: 'upvoteReply',
      downvoteReply: 'downvoteReply',
      bookmarkReply: 'bookmarkReply',
    },
  },
  reports: {
    get: {
      getFirestoreReport: 'getFirestoreReport',
    },
  },
  users: {
    get: {
      getFirestoreUser: 'getFirestoreUser',
      getUserFlatComments: 'getUserFlatComments',
      getUserFlatReplies: 'getUserFlatReplies',
      getNotifications: 'getNotifications',
      getFlatReports: 'getFlatReports',
      getFollowers: 'getFollowers',
      getUserFollowers: 'getUserFollowers',
      getFollowing: 'getFollowing',
      getUserFollowing: 'getUserFollowing',
      isFollowingSignedInUser: 'isFollowingSignedInUser',
      isSignedInUserFollowing: 'isSignedInUserFollowing',
      getWebsiteBookmarks: 'getWebsiteBookmarks',
      getCommentBookmarks: 'getCommentBookmarks',
      getReplyBookmarks: 'getReplyBookmarks',
      listenForNotifications: 'listenForNotifications',
      unsubscribeToNotifications: 'unsubscribeToNotifications',
    },
    set: {
      followUser: 'followUser',
      unfollowUser: 'unfollowUser',
      removeFollower: 'removeFollower',
      setUserURLs: 'setUserURLs',
      setUserDateOfBirth: 'setUserDateOfBirth',
    },
  },
  userPreferences: {
    get: {
      getUserPreferences: 'getUserPreferences',
    },
    set: {
      setUserPreferences: 'setUserPreferences',
    },
  },
  websites: {
    get: {
      getFirestoreWebsite: 'getFirestoreWebsite',
    },
    set: {
      indexWebsite: 'indexWebsite',
      flagWebsite: 'flagWebsite',
      upvoteWebsite: 'upvoteWebsite',
      downvoteWebsite: 'downvoteWebsite',
      bookmarkWebsite: 'bookmarkWebsite',
    },
  },
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
      getRDBUser: 'getRDBUser',
      isUsernameTaken: 'isUsernameTaken',
      getUIDFromUsername: 'getUIDFromUsername',
    },
    set: {
      createRDBUser: 'createRDBUser',
      updateRDBUser: 'updateRDBUser',
      updateRDBUsername: 'updateRDBUsername',
      updateRDBUserFullName: 'updateRDBUserFullName',
      updateRDBUserBio: 'updateRDBUserBio',
    },
  },
  votes: {
    get: {
      getWebsiteVote: 'getWebsiteVote',
      getCommentVote: 'getCommentVote',
      getReplyVote: 'getReplyVote',
    }
  },
  websites: {
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

const STORAGE = {
  users: {
    set: {
      setUserProfilePicture: 'setUserProfilePicture',
    },
  },
}

// Exports:
export const INTERNAL_MESSAGE_ACTIONS = {
  GENERAL: {
    TOGGLE: 'TOGGLE',
    TAKE_SCREENSHOT: 'TAKE_SCREENSHOT',
    ON_EVENT: 'ON_EVENT',
    GET_FAVICON: 'GET_FAVICON',
  },
  AUTH,
  FIRESTORE_DATABASE,
  REALTIME_DATABASE,
  STORAGE,
}
