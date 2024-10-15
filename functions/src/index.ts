require('module-alias/register')

// Packages:
import * as functions from 'firebase-functions/v1'
import {
  addComment,
  deleteComment,
  reportComment,
  editComment,
  checkCommentForHateSpeech,
  upvoteComment,
  downvoteComment,
  bookmarkComment,
  notInterestedInComment,
} from './comment'
import {
  addReply,
  deleteReply,
  reportReply,
  editReply,
  checkReplyForHateSpeech,
  upvoteReply,
  downvoteReply,
  bookmarkReply,
} from './reply'
import {
  reviewReports,
} from './report'
import {
  pruneTopicComments,
} from './topics'
import {
  createRDBUser,
  updateRDBUser,
  updateRDBUserFullName,
  updateRDBUsername,
  followUser,
  unfollowUser,
  removeFollower,
  muteUser,
  unmuteUser,
  updateRDBUserBio,
  updateRDBUserURLs,
  setUserDateOfBirth,
} from './user'
import {
  indexWebsite,
  flagWebsite,
  incrementWebsiteImpression,
  upvoteWebsite,
  downvoteWebsite,
  bookmarkWebsite,
} from './website'

// Exports:
// comment.ts
exports.addComment = functions.https.onCall(async (data, context) => addComment(data, context))
exports.deleteComment = functions.https.onCall(async (data, context) => deleteComment(data, context))
exports.reportComment = functions.https.onCall(async (data, context) => reportComment(data, context))
exports.editComment = functions.https.onCall(async (data, context) => editComment(data, context))
exports.checkCommentForHateSpeech = functions.https.onCall(async (data, context) => checkCommentForHateSpeech(data, context))
exports.upvoteComment = functions.https.onCall(async (data, context) => upvoteComment(data, context))
exports.downvoteComment = functions.https.onCall(async (data, context) => downvoteComment(data, context))
exports.bookmarkComment = functions.https.onCall(async (data, context) => bookmarkComment(data, context))
exports.notInterestedInComment = functions.https.onCall(async (data, context) => notInterestedInComment(data, context))

// reply.ts
exports.addReply = functions.https.onCall(async (data, context) => addReply(data, context))
exports.deleteReply = functions.https.onCall(async (data, context) => deleteReply(data, context))
exports.reportReply = functions.https.onCall(async (data, context) => reportReply(data, context))
exports.editReply = functions.https.onCall(async (data, context) => editReply(data, context))
exports.checkReplyForHateSpeech = functions.https.onCall(async (data, context) => checkReplyForHateSpeech(data, context))
exports.upvoteReply = functions.https.onCall(async (data, context) => upvoteReply(data, context))
exports.downvoteReply = functions.https.onCall(async (data, context) => downvoteReply(data, context))
exports.bookmarkReply = functions.https.onCall(async (data, context) => bookmarkReply(data, context))

// report.ts
exports.reviewReports = reviewReports

// topics.ts
exports.pruneTopicComments = pruneTopicComments

// user.ts
exports.createRDBUser = functions.https.onCall(async (data, context) => createRDBUser(data, context))
exports.updateRDBUser = functions.https.onCall(async (data, context) => updateRDBUser(data, context))
exports.updateRDBUserFullName = functions.https.onCall(async (data, context) => updateRDBUserFullName(data, context))
exports.updateRDBUsername = functions.https.onCall(async (data, context) => updateRDBUsername(data, context))
exports.followUser = functions.https.onCall(async (data, context) => followUser(data, context))
exports.unfollowUser = functions.https.onCall(async (data, context) => unfollowUser(data, context))
exports.removeFollower = functions.https.onCall(async (data, context) => removeFollower(data, context))
exports.muteUser = functions.https.onCall(async (data, context) => muteUser(data, context))
exports.unmuteUser = functions.https.onCall(async (data, context) => unmuteUser(data, context))
exports.updateRDBUserBio = functions.https.onCall(async (data, context) => updateRDBUserBio(data, context))
exports.updateRDBUserURLs = functions.https.onCall(async (data, context) => updateRDBUserURLs(data, context))
exports.setUserDateOfBirth = functions.https.onCall(async (data, context) => setUserDateOfBirth(data, context))

// website.ts
exports.indexWebsite = functions.https.onCall(async (data, context) => indexWebsite(data, context))
exports.flagWebsite = functions.https.onCall(async (data, context) => flagWebsite(data, context))
exports.incrementWebsiteImpression = functions.https.onCall(async (data, context) => incrementWebsiteImpression(data, context))
exports.upvoteWebsite = functions.https.onCall(async (data, context) => upvoteWebsite(data, context))
exports.downvoteWebsite = functions.https.onCall(async (data, context) => downvoteWebsite(data, context))
exports.bookmarkWebsite = functions.https.onCall(async (data, context) => bookmarkWebsite(data, context))

// import * as logger from 'firebase-functions/logger'
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true})
//   response.send("Hello from Firebase!")
// })
