// Typescript:
import type { CommentID, Topic } from 'types/comments-and-replies'
import type { UID } from 'types/user'
import type {
  URLHash,
  WebsiteCategory,
  WebsiteFlagReason,
} from 'types/websites'

// Exports:
export const FIRESTORE_DATABASE_PATHS = {
  USERS: {
    INDEX: 'users',
    COMMENTS: {
      INDEX: 'comments',
    },
    REPLIES: {
      INDEX: 'replies',
    },
    NOTIFICATIONS: {
      INDEX: 'notifications',
    },
    REPORTS: {
      INDEX: 'reports',
    },
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
    user: (UID: UID) => `users/${ UID }`,
    username: (UID: UID) => `users/${ UID }/username`,
    fullName: (UID: UID) => `users/${ UID }/fullName`,
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
    commentCount: (URLHash: URLHash) => `websites/${ URLHash }/commentCount`,
    category: (URLHash: URLHash) => `websites/${ URLHash }/category`,
    categoryCount: (URLHash: URLHash, category: WebsiteCategory) => `websites/${ URLHash }/category/count/${ category }`,
    categoryVoter: (URLHash: URLHash, UID: UID) => `websites/${ URLHash }/category/voters/${ UID }`,
  },
  TOPICS: {
    topic: (topic: Topic) => `topics/${ topic }`,
    topicComments: (topic: Topic) => `topics/${ topic }/comments`,
    topicCommentScores: (topic: Topic) => `topics/${ topic }/comments/scores`,
    topicCommentScore: (topic: Topic, commentID: CommentID) => `topics/${ topic }/comments/scores/${ commentID }`,
    topicCommentHotScore: (topic: Topic, commentID: CommentID) => `topics/${ topic }/comments/scores/${ commentID }/hotScore`,
    topicCommentURLHash: (topic: Topic, commentID: CommentID) => `topics/${ topic }/comments/scores/${ commentID }/URLHash`,
    topicCommentsCount: (topic: Topic) => `topics/${ topic }/comments/count`,
  },
  MUTED: {
    mutedUsers: (primaryUID: UID) => `muted/${ primaryUID }`,
    mutedUserOfUser: (primaryUID: UID, secondaryUID: UID) => `muted/${ primaryUID }/${ secondaryUID }`,
  },
}
