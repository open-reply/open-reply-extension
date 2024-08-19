// Functions:
const shouldNotifyUserForReply = (replyCount: number) => {
  if (replyCount <= 10) return true                                                  // 10 notifications
  else if (replyCount > 10 && replyCount <= 50) return replyCount % 5 === 0            // 8 notifications
  else if (replyCount > 50 && replyCount <= 100) return replyCount % 10 === 0          // 5 notifications
  else if (replyCount > 100 && replyCount <= 500) return replyCount % 25 === 0         // 16 notifications
  else if (replyCount > 500 && replyCount <= 1000) return replyCount % 50 === 0        // 10 notifications
  else if (replyCount > 1000 && replyCount <= 5000) return replyCount % 250 === 0      // 16 notifications
  else return replyCount % 500 === 0
}

// Exports:
export default shouldNotifyUserForReply
