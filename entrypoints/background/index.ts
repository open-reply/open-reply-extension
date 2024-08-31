/// <reference types='chrome' />

// Packages:
import {
  _authenticateWithEmailAndPassword,
} from './firebase/auth'
import {
  _isCommentBookmarked,
} from './firebase/realtime-database/comment/get'
import {
  _getAllMutedUsers,
} from './firebase/realtime-database/muted/get'
import {
  _muteUser,
  _unmuteUser,
} from './firebase/realtime-database/muted/set'
import {
  _getRecentActivityFromUser,
} from './firebase/realtime-database/recentActivity/get'
import {
  _isReplyBookmarked,
} from './firebase/realtime-database/reply/get'
import {
  _getUserTaste,
  _getUserTopicTasteScore,
} from './firebase/realtime-database/tastes/get'
import {
  _getTopicCommentScores,
} from './firebase/realtime-database/topics/get'
import {
  _getRDBUser,
  _getRDBUserSnapshot,
  _isUsernameTaken,
} from './firebase/realtime-database/users/get'
import {
  _updateRDBUser,
  _updateRDBUserFullName,
  _updateRDBUsername,
} from './firebase/realtime-database/users/set'
import {
  _getRDBWebsite,
  _getRDBWebsiteCommentCount,
  _getRDBWebsiteFlagCount,
  _getRDBWebsiteFlagDistribution,
  _getRDBWebsiteFlagDistributionReasonCount,
  _getRDBWebsiteFlagsCumulativeWeight,
  _getRDBWebsiteImpressions,
} from './firebase/realtime-database/website/get'
import {
  _incrementWebsiteImpression,
} from './firebase/realtime-database/website/set'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from '@/constants/internal-messaging'

// Exports:
export default defineBackground(() => {
  chrome.browserAction.onClicked.addListener(() => {
    console.log('Toggling OpenReply..')
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id !== undefined) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'B2C_TOGGLE_VISIBILITY', payload: null })
      }
    })
  })

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      // General:
      case INTERNAL_MESSAGE_ACTIONS.GENERAL.TAKE_SCREENSHOT:
        chrome.tabs.captureVisibleTab({ format: 'png' }, dataURL => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError)
            sendResponse(chrome.runtime.lastError.message)
          } else {
            sendResponse(dataURL)
          }
        })
        return true
      
      
      // Auth:
      case INTERNAL_MESSAGE_ACTIONS.AUTH.AUTHENTICATE:
        _authenticateWithEmailAndPassword(request.payload).then(sendResponse)
        return true


      // Realtime Database:
        // Comment:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.comment.get.isCommentBookmarked:
          _isCommentBookmarked(request.payload).then(sendResponse)
          return true

        // Muted:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.get.getAllMutedUsers:
          _getAllMutedUsers().then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.set.muteUser:
          _muteUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.set.unmuteUser:
          _unmuteUser(request.payload).then(sendResponse)
          return true

        // Recent Activity:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.recentActivity.get.getRecentActivityFromUser:
          _getRecentActivityFromUser(request.payload).then(sendResponse)
          return true

        // Reply:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.reply.get.isReplyBookmarked:
          _isReplyBookmarked(request.payload).then(sendResponse)
          return true
        
        // Tastes:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.tastes.get.getUserTaste:
          _getUserTaste().then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.tastes.get.getUserTopicTasteScore:
          _getUserTopicTasteScore(request.payload).then(sendResponse)
          return true

        // Topics:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.topics.get.getTopicCommentScores:
          _getTopicCommentScores(request.payload).then(sendResponse)
          return true

        // Users:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUserSnapshot:
          _getRDBUserSnapshot(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUser:
          _getRDBUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.isUsernameTaken:
          _isUsernameTaken(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUser:
          _updateRDBUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUsername:
          _updateRDBUsername(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUserFullName:
          _updateRDBUserFullName(request.payload).then(sendResponse)
          return true
        
        // Website:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsite:
          _getRDBWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteImpressions:
          _getRDBWebsiteImpressions(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagDistribution:
          _getRDBWebsiteFlagDistribution(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagDistributionReasonCount:
          _getRDBWebsiteFlagDistributionReasonCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagsCumulativeWeight:
          _getRDBWebsiteFlagsCumulativeWeight(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagCount:
          _getRDBWebsiteFlagCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteCommentCount:
          _getRDBWebsiteCommentCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.set.incrementWebsiteImpression:
          _incrementWebsiteImpression(request.payload).then(sendResponse)
          return true
    }
  })
})
