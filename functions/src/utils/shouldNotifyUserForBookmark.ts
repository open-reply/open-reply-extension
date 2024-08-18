// Functions:
const shouldNotifyUserForBookmark = (bookmarkCount: number) => {
  if (bookmarkCount <= 10) return true                                                  // 10 notifications
  else if (bookmarkCount > 10 && bookmarkCount <= 50) return bookmarkCount % 5 === 0            // 8 notifications
  else if (bookmarkCount > 50 && bookmarkCount <= 100) return bookmarkCount % 10 === 0          // 5 notifications
  else if (bookmarkCount > 100 && bookmarkCount <= 500) return bookmarkCount % 25 === 0         // 16 notifications
  else if (bookmarkCount > 500 && bookmarkCount <= 1000) return bookmarkCount % 50 === 0        // 10 notifications
  else if (bookmarkCount > 1000 && bookmarkCount <= 5000) return bookmarkCount % 250 === 0      // 16 notifications
  else return bookmarkCount % 500 === 0
}

// Exports:
export default shouldNotifyUserForBookmark
