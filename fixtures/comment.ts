// Packages:
import getControversyScore from 'utils/getControversyScore'
import getWilsonScoreInterval from 'utils/getWilsonScoreInterval'

// Typescript:
import { Timestamp } from 'firebase/firestore'
import type { ActivityID } from 'types/activity'
import type {
  CommentID,
  ContentHateSpeechResult,
  Comment,
  Reports,
  Restriction,
  Topic,
} from 'types/comments-and-replies'
import type { UID } from 'types/user'
import type { VoteCount } from 'types/votes'
import type { URLHash } from 'types/websites'

// Constants:
import { DAY, HOUR, WEEK } from 'time-constants'
import { TOPICS } from 'constants/database/comments-and-replies'

// Exports:
export const baseCommentFixture: Comment = {
  id: '770e8400-e29b-41d4-a716-446655440000' as CommentID,
  URLHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' as URLHash,
  domain: 'example.com',
  URL: 'https://example.com/article/123',
  body: `I'm seventy one years old and it was only ten years ago or so of how I treated the first real girl friend started to dawn on me in its full horror. And every year it gets more vivid. I was a callous monster long before I had the consciousness to realise it. Maybe, things are different in Germany and America but I doubt it. This video is a brilliant piece of work and I thank you for it.`,
  author: 'firebase_generated_uid_123456' as UID,
  replyCount: 2,
  voteCount: {
    up: 25,
    down: 5,
    controversy: getControversyScore(25, 5),
    wilsonScore: getWilsonScoreInterval(25, 5),
  } as VoteCount,
  sentiment: 0.6,
  topics: [TOPICS.TECHNOLOGY_AND_GADGETS, TOPICS.ARTIFICIAL_INTELLIGENCE] as Topic[],
  report: {
    reports: ['report1'],
    reportCount: 1
  } as Reports,
  createdAt: new Timestamp(parseInt(((Date.now() / 1000) - DAY).toFixed(0)), 0),
  creationActivityID: 'activity_123456789' as ActivityID,
  lastEditedAt: undefined,
  isRestricted: false,
  restriction: undefined,
  isDeleted: false,
  isRemoved: false,
  hateSpeech: {
    isHateSpeech: false
  } as ContentHateSpeechResult
}

/**
 * A highly upvoted comment.
 */
export const highlyUpvotedComment: Comment = {
  ...baseCommentFixture,
  id: '770e8400-e29b-41d4-a716-446655440001' as CommentID,
  body: `Before clicking on this video, I only knew that some German guy named Goethe (had no idea how to pronounce it) had written a big book called “Faust,” about a guy who made a deal with the devil, and that it was a big influence on Nietzsche and others.

But it was a very clear, interesting, thoughtful, engaging, and highly enjoyable listen.  Thank you.

It felt like I had asked a knowledgeable friend “hey, can you tell me all about that one book ‘Faust’ that people talk about a lot, written by that ‘Goth’ guy?”`,
  replyCount: 50,
  voteCount: {
    up: 1000,
    down: 50,
    controversy: getControversyScore(1000, 50),
    wilsonScore: getWilsonScoreInterval(1000, 50),
  } as VoteCount,
  sentiment: 0.9,
}

/**
 * A controversial comment.
 */
export const controversialComment: Comment = {
  ...baseCommentFixture,
  id: '770e8400-e29b-41d4-a716-446655440002' as CommentID,
  body: `I don't know how I started listening, I was tidying up and this started on autoplay. I figured I would put on an audiobook I'd been planning to listen to. Now I'm an hour in,  wishing I'd found this prior to an ARG I participated in September/October 23 based around the seven deadly sins.

I am woefully undereducated in classical literature. I blame my Catholic upbringing and Catholic school for cornering me into atheism by high school. And an English literature teacher who managed an impossible task; turning thought-provoking texts into bland gibberish through rote learning and repetition.
Not that my school would have touched Faust & Mephisto; the idea of students reciting non-biblical texts which dissect deals with an adversary would be considered akin to a seance in the school chapel.

Anyway an hour in and wanting to cancel my other commitments. This is so beautifully analysed. I'll be back!`,
  replyCount: 100,
  voteCount: {
    up: 500,
    down: 450,
    controversy: getControversyScore(500, 450),
    wilsonScore: getWilsonScoreInterval(500, 450),
  } as VoteCount,
  sentiment: -0.2,
}

/**
 * A comment flagged for hate speech.
 */
export const hateSpeechComment: Comment = {
  ...baseCommentFixture,
  id: '770e8400-e29b-41d4-a716-446655440003' as CommentID,
  body: `This channel, albeit in the public domain, due to its content, is for the few, and so, it is with the major works of art, literature and philosophy, they are not meant to be understood by the average reader.  

By necessary, such knowledge would be esoteric, hermetic, because, the rarest treasures are often left untouched by a less capable generation of readership. 

A good indicative for a great channel is the boundless multifariousness and multiplicity of its content, because, with constant posting, the literary and narrative devices (e.g., simile, tropes and figurative speech) would soon become trite, commonplace and hackneyed. 

Whereas a charismatic, eloquent,  charming, good looking face could draw the viewers by the score, a man or woman of true genius is often found as the most beautiful, nay, original, but in the faceless scribe of remarkable literature and brilliance, and such qualities could still win a more distinguished company among the kindred souls.`,
  replyCount: 0,
  hateSpeech: {
    isHateSpeech: true,
    reason: 'Contains offensive language'
  } as ContentHateSpeechResult,
  sentiment: -0.8,
}

/**
 * A comment restricted by manual moderation.
 */
export const restrictedComment: Comment = {
  ...baseCommentFixture,
  id: '550e8400-e29b-42d4-a716-446655440003' as CommentID,
  body: `The Algorithm Knows!!!! 👁️
I'm only a half hour in but I'm enjoying this so much that I felt compelled to leave a comment. Good stuff man!`,
  isRestricted: true,
  restriction: {
    restrictor: 'admin_uid_123' as UID,
    reason: 'Hate speech violation',
    restrictedOn: new Timestamp(parseInt(((Date.now() - 3 * WEEK) / 1000).toFixed(0)), 0),
  } as Restriction,
}

/**
 * A deleted comment.
 */
export const deletedComment: Comment = {
  ...baseCommentFixture,
  id: '770e8400-e29b-41d4-a716-446655440004' as CommentID,
  body: `I don't think Goethe's Faust is about seeking happiness.`,
  isDeleted: true,
  lastEditedAt: new Timestamp(parseInt(((Date.now() - 3 * HOUR) / 1000).toFixed(0)), 0),
  replyCount: 5,
}

/**
 * A comment removed by the moderators.
 */
export const removedComment: Comment = {
  ...baseCommentFixture,
  id: '770e8400-e29b-41d4-a716-446655440005' as CommentID,
  body: `This got me through almost half my workday, and the fact that I didn't think to change to another video once I started, that is a feat!`,
  isRemoved: true,
  lastEditedAt: new Timestamp(parseInt(((Date.now() - 2 * HOUR) / 1000).toFixed(0)), 0),
  replyCount: 10,
}

export const commentFixtures = [
  baseCommentFixture,
  highlyUpvotedComment,
  controversialComment,
  hateSpeechComment,
  restrictedComment,
  deletedComment,
  removedComment,
]
