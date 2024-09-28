// Packages:
import getControversyScore from 'utils/getControversyScore'
import getWilsonScoreInterval from 'utils/getWilsonScoreInterval'

// Typescript:
import { Timestamp } from 'firebase/firestore'
import type { ActivityID } from 'types/activity'
import type {
  CommentID,
  ContentHateSpeechResult,
  Reply,
  ReplyID,
  Reports,
  Restriction,
} from 'types/comments-and-replies'
import type { UID } from 'types/user'
import type { VoteCount } from 'types/votes'
import type { URLHash } from 'types/websites'

// Constants:
import { DAY, HOUR, WEEK } from 'time-constants'

// Exports:
export const baseReplyFixture: Reply = {
  id: '550e8400-e29b-41d4-a716-446655440000' as ReplyID,
  secondaryReplyID: '660e8400-e29b-41d4-a716-446655440000' as ReplyID,
  commentID: '770e8400-e29b-41d4-a716-446655440000' as CommentID,
  URLHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' as URLHash,
  domain: 'example.com',
  URL: 'https://example.com/article/123',
  body: 'This is a sample reply to the comment.',
  author: 'firebase_generated_uid_123456' as UID,
  voteCount: {
    up: 15,
    down: 3,
    controversy: getControversyScore(15, 3),
    wilsonScore: getWilsonScoreInterval(15, 3),
  } as VoteCount,
  report: {
    reports: ['report1', 'report2'],
    reportCount: 2,
  } as Reports,
  createdAt: new Timestamp(parseInt(((Date.now() - DAY) / 1000).toFixed(0)), 0),
  creationActivityID: 'activity_123456789' as ActivityID,
  lastEditedAt: undefined,
  isRestricted: false,
  restriction: undefined,
  isDeleted: false,
  isRemoved: false,
  hateSpeech: {
    isHateSpeech: false,
  } as ContentHateSpeechResult,
}

/**
 * A highly upvoted reply.
 */
export const highlyUpvotedReply: Reply = {
  ...baseReplyFixture,
  id: '550e8400-e29b-41d4-a716-446655440001' as ReplyID,
  body: 'This is a highly upvoted reply.',
  voteCount: {
    up: 1000,
    down: 50,
    controversy: getControversyScore(1000, 50),
    wilsonScore: getWilsonScoreInterval(1000, 50),
  } as VoteCount,
}

/**
 * A controversial reply.
 */
export const controversialReply: Reply = {
  ...baseReplyFixture,
  id: '550e8400-e29b-41d4-a716-446655440002' as ReplyID,
  body: 'This is a controversial reply with many upvotes and downvotes.',
  voteCount: {
    up: 500,
    down: 450,
    controversy: getControversyScore(500, 450),
    wilsonScore: getWilsonScoreInterval(500, 450),
  } as VoteCount,
}

/**
 * A reply flagged for hate speech.
 */
export const hateSpeechReply: Reply = {
  ...baseReplyFixture,
  id: '550e8400-e29b-41d4-a716-446655440003' as ReplyID,
  body: 'This reply has been flagged for hate speech.',
  hateSpeech: {
    isHateSpeech: true,
    reason: 'Contains offensive language'
  } as ContentHateSpeechResult,
  isRestricted: true,
  restriction: {
    restrictor: 'admin_uid_123' as UID,
    reason: 'Hate speech violation',
    restrictedOn: new Timestamp(parseInt(((Date.now() - 3 * WEEK) / 1000).toFixed(0)), 0),
  } as Restriction,
}

/**
 * A deleted reply.
 */
export const deletedReply: Reply = {
  ...baseReplyFixture,
  id: '550e8400-e29b-41d4-a716-446655440004' as ReplyID,
  body: '[This reply has been deleted by the user]',
  isDeleted: true,
  lastEditedAt: new Timestamp(parseInt(((Date.now() - 3 * HOUR) / 1000).toFixed(0)), 0),
}

/**
 * A reply removed by the moderators.
 */
export const removedReply: Reply = {
  ...baseReplyFixture,
  id: '550e8400-e29b-41d4-a716-446655440005' as ReplyID,
  body: '[This reply has been removed by moderators]',
  isRemoved: true,
  lastEditedAt: new Timestamp(parseInt(((Date.now() - 2 * HOUR) / 1000).toFixed(0)), 0),
}
