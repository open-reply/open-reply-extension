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
    BOOKMARKED_WEBSITES: {
      INDEX: 'bookmarked-websites',
    },
    BOOKMARKED_COMMENTS: {
      INDEX: 'bookmarked-comments',
    },
    BOOKMARKED_REPLIES: {
      INDEX: 'bookmarked-replies',
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
  MAIL: {
    INDEX: 'mail',
  },
}

export const REALTIME_DATABASE_PATHS = {
  USERS: {
    user: (UID: UID) => `users/${ UID }`,
    username: (UID: UID) => `users/${ UID }/username`,
    fullName: (UID: UID) => `users/${ UID }/fullName`,
    bio: (UID: UID) => `users/${ UID }/bio`,
    followerCount: (UID: UID) => `users/${ UID }/followerCount`,
    followingCount: (UID: UID) => `users/${ UID }/followingCount`,
    usernameLastChangedDate: (UID: UID) => `users/${ UID }/usernameLastChangedDate`,
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
    topics: (URLHash: URLHash) => `websites/${ URLHash }/topics`,
    topic: (URLHash: URLHash, topic: Topic) => `websites/${ URLHash }/topics/${ topic }`,
    topicUpvotes: (URLHash: URLHash, topic: Topic) => `websites/${ URLHash }/topics/${ topic }/upvotes`,
    topicDownvotes: (URLHash: URLHash, topic: Topic) => `websites/${ URLHash }/topics/${ topic }/downvotes`,
    topicScore: (URLHash: URLHash, topic: Topic) => `websites/${ URLHash }/topics/${ topic }/score`,
    totalVotesOnComments: (URLHash: URLHash) => `websites/${ URLHash }/totalVotesOnComments`,
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
    recentActivities: (UID: UID) => `recentActivity/${ UID }`,
    recentyActivity: (UID: UID, activityID: ActivityID) => `recentActivity/${ UID }/${ activityID }`,
  },
  RECENT_ACTIVITY_COUNT: {
    recentActivityCount: (UID: UID) => `recentActivityCount/${ UID }`,
  },
  TASTES: {
    taste: (UID: UID) => `tastes/${ UID }`,
    topicsTaste: (UID: UID) => `tastes/${ UID }/topics`,
    topicTaste: (UID: UID, topic: Topic) => `tastes/${ UID }/topics/${ topic }`,
    topicTasteScore: (UID: UID, topic: Topic) => `tastes/${ UID }/topics/${ topic }/score`,
    topicTasteNotInterested: (UID: UID, topic: Topic) => `tastes/${ UID }/topics/${ topic }/notInterested`,
  },
  BOOKMARKS: {
    websiteBookmarkStats: (URLHash: URLHash) => `bookmarks/websites/${ URLHash }`,
    websiteBookmarkCount: (URLHash: URLHash) => `bookmarks/websites/${ URLHash }/bookmarkCount`,
    websiteBookmarkedByUser: (URLHash: URLHash, UID: UID) => `bookmarks/websites/${ URLHash }/bookmarkedBy/${ UID }`,
    commentBookmarkStats: (commentID: CommentID) => `bookmarks/comments/${ commentID }`,
    commentBookmarkCount: (commentID: CommentID) => `bookmarks/comments/${ commentID }/bookmarkCount`,
    commentBookmarkedByUser: (commentID: CommentID, UID: UID) => `bookmarks/comments/${ commentID }/bookmarkedBy/${ UID }`,
    replyBookmarkStats: (replyID: URLHash) => `bookmarks/replies/${ replyID }`,
    replyBookmarkCount: (replyID: URLHash) => `bookmarks/replies/${ replyID }/bookmarkCount`,
    replyBookmarkedByUser: (replyID: URLHash, UID: UID) => `bookmarks/replies/${ replyID }/bookmarkedBy/${ UID }`,
  },
  NOTIFICATIONS: {
    notificationCount: (UID: UID) => `notifications/${ UID }/notificationCount`,
  }
}
