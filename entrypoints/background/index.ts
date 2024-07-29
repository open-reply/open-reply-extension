/// <reference types='chrome' />

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from '@/constants/internal-messaging'

// Exports:
export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case INTERNAL_MESSAGE_ACTIONS.TAKE_SCREENSHOT:
        chrome.tabs.captureVisibleTab({ format: 'png' }, dataURL => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError)
            sendResponse(chrome.runtime.lastError.message)
          } else {
            sendResponse(dataURL)
          }
        })
        return true
    }
  })
})
