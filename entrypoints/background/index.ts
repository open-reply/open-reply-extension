/// <reference types='chrome' />

// Packages:
import {
  _authenticateWithEmailAndPassword,
} from './firebase/auth'
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
