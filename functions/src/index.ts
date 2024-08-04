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
} from './comment'

// Declarations:
initializeApp()

// Exports:
exports.indexWebsite = functions.https.onCall(async (data, context) => indexWebsite(data, context))
exports.flagWebsite = functions.https.onCall(async (data, context) => flagWebsite(data, context))
exports.incrementWebsiteImpression = functions.https.onCall(async (data, context) => incrementWebsiteImpression(data, context))
exports.setWebsiteCategory = functions.https.onCall(async (data, context) => setWebsiteCategory(data, context))
exports.addComment = functions.https.onCall(async (data, context) => addComment(data, context))

// import * as logger from 'firebase-functions/logger'
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true})
//   response.send("Hello from Firebase!")
// })
