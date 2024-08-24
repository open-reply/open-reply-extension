// Constants:
const AUTH = {
  AUTHENTICATE: 'AUTHENTICATE',
  LOGOUT: 'LOGOUT',

  AUTH_STATE: 'AUTH_STATE',
}

const REALTIME_DATABASE = {
  GET: {
    getRDBUserSnapshot: 'getRDBUserSnapshot',
    getRDBUser: 'getRDBUser',
    isUsernameTaken: 'isUsernameTaken',
  },
  SET: {

  },
}

// Exports:
export const INTERNAL_MESSAGE_ACTIONS = {
  GENERAL: {
    TAKE_SCREENSHOT: 'TAKE_SCREENSHOT',
  },
  AUTH,
  REALTIME_DATABASE,
}
