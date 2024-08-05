require('module-alias/register')

// Packages:
import * as functions from 'firebase-functions/v1'
import { initializeApp } from 'firebase-admin/app'
import {
  indexWebsite,
  flagWebsite,
  incrementWebsiteImpression,
  setWebsiteCategory,
} from './website'
import {
  addComment,
  deleteComment,
} from './comment'
import {
  addReply,
  deleteReply,
} from './reply'

// Declarations:
initializeApp()

// Exports:
exports.indexWebsite = functions.https.onCall(async (data, context) => indexWebsite(data, context))
exports.flagWebsite = functions.https.onCall(async (data, context) => flagWebsite(data, context))
exports.incrementWebsiteImpression = functions.https.onCall(async (data, context) => incrementWebsiteImpression(data, context))
exports.setWebsiteCategory = functions.https.onCall(async (data, context) => setWebsiteCategory(data, context))

exports.addComment = functions.https.onCall(async (data, context) => addComment(data, context))
exports.deleteComment = functions.https.onCall(async (data, context) => deleteComment(data, context))

exports.addReply = functions.https.onCall(async (data, context) => addReply(data, context))
exports.deleteReply = functions.https.onCall(async (data, context) => deleteReply(data, context))

// import * as logger from 'firebase-functions/logger'
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true})
//   response.send("Hello from Firebase!")
// })
