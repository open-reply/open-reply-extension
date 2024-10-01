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
  body: `Your pursuit of philosphy and you being available on YouTube reminded me of the late great Dr. Michael Sugrue. All the best and i wish to see more from you`,
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
  body: `Absolutely loved this lecture. In the 21st century, I think the wisdom from this discourse reminds us that true art should empower us to live better lives. The tragedy of our times is that such enriching art is getting harder to find due to the rise of mimetics and commodification. It's up to us as individuals to discern and seek out art that truly matters and has depth.

Rousseau’s point about the next generation of wise individuals not needing teachers but following the spirit of virtue in the arts by intuition is inspiring, it reminds me of Herbert Marcuse and The Great Refusal. It emphasizes that our attention is precious, and we should focus it on subjects that have genuine substance and depth. To not abandon art, but rather, strive to appreciate and support art that enriches our lives. 

Again, great talk, looking forward to your next video!`,
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
  body: `It's such a pleasure to have found your channel! Your work is so clear and easy to listen to as you explain these ideas so many people would consider inaccessible. I slide in and out of philosophy YouTube, so thank you for pulling me back in! I'm working my way eagerly through you Girard videos, I knew nothing about him and now I find him fascinating. Also, I'm sure you're told some variation of this a lot, but you dress to the teeth, sir, you always look sharp as a tack! Thank you for providing such high-qaulity content, from the picture quality to the editing to your gently passionate discussions and lectures, completely for free, this is a tremendous resource! Cheers.`,
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
  body: `speaking of Athenians being tricksters, your words are cloaked in wordplay and the poetry of language. Something you are set against. Athenians believed in many gods. the Spartans believed in many gods and in general both communities believed in the same gods and praised both the same way. you are putting the idea forward that says, heroes are better ways to live than intelligence and art. but our country was founded by people who believed just the opposite. they believed the pen was mightier than the sword. that is why this country has a constitution that defines our laws. we are not ruled by an elite god-like group.  our civil war showed quite clearly that war is not the answer. during both ww1 and ww2 America was reluctant to enter either war. if we went to war our "heroes" would suffer the most. if they came home at all it would be with broken hearts and minds not to mention a few legs, arms, and other body parts. what this lecture says is that a young person has only developed his body and not his mind. before he thinks, we the elite, will conscript him/her into the armed forces and send him to the front lines. Just like king David did to get rid of his loyal hero.  you are saying king david was a voyeur, luster, a massagist, and some kind of power-seeking hero. if you want a woman, go out and take her. seems caveman to me. the truth of the matter is that civilization today claims to be positively affected by the arts. the arts show intelligence and the freedom to think whatever you want to think. your spartan world believes might is right. Of course, Jon Bi will be back at home enjoying his fine wine, reading a book beside the fire with his lapdog and his wife will be preparing dinner like she should be.`,
  hateSpeech: {
    isHateSpeech: true,
    reason: 'Contains offensive language'
  } as ContentHateSpeechResult,
}

/**
 * A reply restricted by manual moderation.
 */
export const restrictedReply: Reply = {
  ...baseReplyFixture,
  id: '550e8400-e29b-42d4-a716-446655440003' as ReplyID,
  body: `can't tell if elaborate sardonic troll or somewhat self aware deliberate high brow poshness. Really owning it either way.`,
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
  body: `Also: Leave it to the French to dehumanize science. Lol.`,
  isDeleted: true,
  lastEditedAt: new Timestamp(parseInt(((Date.now() - 3 * HOUR) / 1000).toFixed(0)), 0),
}

/**
 * A reply removed by the moderators.
 */
export const removedReply: Reply = {
  ...baseReplyFixture,
  id: '550e8400-e29b-41d4-a716-446655440005' as ReplyID,
  body: `What stupid fucking content.`,
  isRemoved: true,
  lastEditedAt: new Timestamp(parseInt(((Date.now() - 2 * HOUR) / 1000).toFixed(0)), 0),
}

export const replyFixtures = [
  baseReplyFixture,
  highlyUpvotedReply,
  controversialReply,
  hateSpeechReply,
  restrictedReply,
  deletedReply,
  removedReply,
]
