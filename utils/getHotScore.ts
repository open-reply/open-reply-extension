// Functions:
/**
 * It generates a time-dependent Hot Score, useful for ranking comments for the feed.
 * 
 * The original Hot Score algorithm is implemented in [_sorts.pyx](https://github.com/reddit/reddit/blob/master/r2/r2/lib/db/_sorts.pyx).
 */
const getHotScore = (upvotes: number, downvotes: number, createdOn: number) => {
  const s = upvotes - downvotes
  const order = Math.log10(Math.max(Math.abs(s), 1))
  const sign = s > 0 ? 1 : s < 0 ? -1 : 0
  const seconds = createdOn - Date.now()
  return Number((sign * order + seconds / 45000).toFixed(7))
}

// Exports:
export default getHotScore
