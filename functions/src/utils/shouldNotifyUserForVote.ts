// Functions:
const shouldNotifyUserForVote = (totalVote: number) => {
  if (totalVote <= 10) return true                                                  // 10 notifications
  else if (totalVote > 10 && totalVote <= 50) return totalVote % 5 === 0            // 8 notifications
  else if (totalVote > 50 && totalVote <= 100) return totalVote % 10 === 0          // 5 notifications
  else if (totalVote > 100 && totalVote <= 500) return totalVote % 25 === 0         // 16 notifications
  else if (totalVote > 500 && totalVote <= 1000) return totalVote % 50 === 0        // 10 notifications
  else if (totalVote > 1000 && totalVote <= 5000) return totalVote % 250 === 0      // 16 notifications
  else return totalVote % 500 === 0
}

// Exports:
export default shouldNotifyUserForVote
