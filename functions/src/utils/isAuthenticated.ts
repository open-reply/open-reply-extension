// Packages:
import * as functions from 'firebase-functions/v1'

// Functions:
const isAuthenticated = (context: functions.https.CallableContext) => {
  return context.auth !== undefined && context.auth !== null
}

// Exports:
export default isAuthenticated
