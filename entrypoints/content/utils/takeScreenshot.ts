// Packages:
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from '@/constants/internal-messaging'

// Functions:
const takeScreenshot = (
  onScreenshot: (dataURL: string) => void,
  onError: (error: Error) => void,
) => {
  chrome.runtime.sendMessage({ action: INTERNAL_MESSAGE_ACTIONS.TAKE_SCREENSHOT }, (response: Returnable<string, string>) => {
    if (response && response.status) {
      onScreenshot(response.payload)
    } else {
      logError({
        functionName: 'takeScreenshot',
        data: null,
        error: response.payload,
      })

      onError(new Error(response.payload))
    }
  })
}

// Exports:
export default takeScreenshot
