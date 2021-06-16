// Imports:
import { PLANS } from '../user';


// Constants:
const URLS_REF = 'URLs/';
const COMMENTS_REF = 'comments/';
const REPLIES_REF = 'replies/';


// Exports:
export const DATABASE_CONSTANTS = {
  REALTIME: {
    GLOBALS_REF: {
      URL_COUNT: 'global/URLCount',
      COMMENT_COUNT: 'global/commentCount',
      REPLY_COUNT: 'global/replyCount',
    },
    URLS_REF,
    COMMENTS_REF,
    REPLIES_REF,
    VOTES_REF: {
      URLS: 'votes/' + URLS_REF,
      COMMENTS: 'votes/' + COMMENTS_REF,
      REPLIES: 'votes/' + REPLIES_REF,
    },
    FLAGS_REF: {
      URLS: 'flags/' + URLS_REF,
      COMMENTS: 'flags/' + COMMENTS_REF,
      REPLIES: 'flags/' + REPLIES_REF,
    }
  },
  STORAGE: {
    USERS_COLLECTION: 'users',
    URLS_COLLECTION: 'URLs',
    COMMENTS_COLLECTION: 'comments',
    REPLIES_COLLECTION: 'replies',
  }
};

export const DEFAULT_DATABASE_USER = {
  UID: '',
  babyMode: true,
  URLs: [],
  comments: [],
  replies: [],
  votes: [],
  totalURLs: 0,
  totalComments: 0,
  totalReplies: 0,
  totalVotes: 0,
  createdOn: 0,
  quota: {
    URLs: 0,
    comments: 0,
    replies: 0,
    endTime: 0
  },
  plan: PLANS.FREE
};
