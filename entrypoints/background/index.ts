/// <reference types='chrome' />

// Packages:
import { authenticateWithEmailAndPassword } from './firebase/auth'
import {
  getRDBUser,
  getRDBUserSnapshot,
  isUsernameTaken,
} from './firebase/realtime-database/users/get'

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
        authenticateWithEmailAndPassword(request.payload).then(sendResponse)
        return true

      // Realtime Database:
      case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUserSnapshot:
        getRDBUserSnapshot(request.payload).then(sendResponse)
        return true
      case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUser:
        getRDBUser(request.payload).then(sendResponse)
        return true
      case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.isUsernameTaken:
        isUsernameTaken(request.payload).then(sendResponse)
        return true
    }
  })
})
