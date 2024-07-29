// Packages:
import logError from './logError'

// Typescript:
import { Returnable } from '../types'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from '@/constants/internal-messaging'

// Functions:
const takeScreenshot = (onScreenshot: (dataURL: string) => void) => {
  chrome.runtime.sendMessage({ action: INTERNAL_MESSAGE_ACTIONS.TAKE_SCREENSHOT }, (response: Returnable<string, string>) => {
    if (response && response.status) {
      onScreenshot(response.payload)
    } else {
      logError({
        functionName: 'takeScreenshot',
        data: null,
        error: response.payload,
      })
    }
  })
}

// Exports:
export default takeScreenshot
