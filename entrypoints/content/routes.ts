// Constants:
const ROUTES = {
  INDEX: '/',
  AUTHENTICATION: '/authentication',
  FEED: '/feed',
  WEBSITE: '/website',
  SETUP_ACCOUNT: '/setup-account',
  PROFILE: '/profile',
  USER: '/u/:username',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  COMMENT: '/comment/:URLHash/:commentID',
  REPLY: '/comment/:URLHash/:commentID/:replyID',
  REPORT: '/:reportID'
}

// Exports:
export default ROUTES
