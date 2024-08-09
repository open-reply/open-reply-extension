// Typescript:
import type { ActivityID } from 'types/activity'
import type {
  CommentID,
  ReplyID,
  Topic,
} from 'types/comments-and-replies'
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
    FOLLOWERS: {
      INDEX: 'followers',
    },
    FOLLOWING: {
      INDEX: 'following',
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
    websiteVote: (URLHash: URLHash, UID: UID) => `votes/websites/${ URLHash }/${ UID }`,
    websiteVoteType: (URLHash: URLHash, UID: UID) => `votes/websites/${ URLHash }/${ UID }/vote`,
    websiteVotedOn: (URLHash: URLHash, UID: UID) => `votes/websites/${ URLHash }/${ UID }/votedOn`,
    commentVote: (commentID: CommentID, UID: UID) => `votes/comments/${ commentID }/${ UID }`,
    commentVoteType: (commentID: CommentID, UID: UID) => `votes/comments/${ commentID }/${ UID }/vote`,
    commentVotedOn: (commentID: CommentID, UID: UID) => `votes/comments/${ commentID }/${ UID }/votedOn`,
    replyVote: (replyID: ReplyID, UID: UID) => `votes/replies/${ replyID }/${ UID }`,
    replyVoteType: (replyID: ReplyID, UID: UID) => `votes/replies/${ replyID }/${ UID }/vote`,
    replyVotedOn: (replyID: ReplyID, UID: UID) => `votes/replies/${ replyID }/${ UID }/votedOn`,
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
    topicCommentAuthor: (topic: Topic, commentID: CommentID) => `topics/${ topic }/comments/scores/${ commentID }/author`,
    topicCommentsCount: (topic: Topic) => `topics/${ topic }/comments/count`,
  },
  MUTED: {
    mutedUsers: (primaryUID: UID) => `muted/${ primaryUID }`,
    mutedUserOfUser: (primaryUID: UID, secondaryUID: UID) => `muted/${ primaryUID }/${ secondaryUID }`,
  },
  RECENT_ACTIVITY: {
    recentActivityDetails: (UID: UID) => `recentActivity/${ UID }`,
    recentActivities: (UID: UID) => `recentActivity/${ UID }/activities`,
    recentyActivity: (UID: UID, activityID: ActivityID) => `recentActivity/${ UID }/activities/${ activityID }`,
    recentActivityCount: (UID: UID) => `recentActivity/${ UID }/count`,
  },
  TASTES: {
    taste: (UID: UID) => `tastes/${ UID }`,
    topicsTaste: (UID: UID) => `tastes/${ UID }/topics`,
    topicTaste: (UID: UID, topic: Topic) => `tastes/${ UID }/topics/${ topic }`,
    topicTasteScore: (UID: UID, topic: Topic) => `tastes/${ UID }/topics/${ topic }/score`,
    topicTasteNotInterested: (UID: UID, topic: Topic) => `tastes/${ UID }/topics/${ topic }/notInterested`,
  },
}
