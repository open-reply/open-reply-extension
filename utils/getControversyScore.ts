// Functions:
/**
 * It generates a time-independent controversy score, useful for `OrderBy.Controversial`
 * 
 * The original Controversy algorithm is implemented in [_sorts.pyx](https://github.com/reddit/reddit/blob/master/r2/r2/lib/db/_sorts.pyx).
 * 
 * ```LaTeX
 * m = u + d
 * b = { u > d: d/u, u <= d: u/d }
 * y = m^b
 * ```
 */
const getControversyScore = (upvotes: number, downvotes: number) => {
  if (downvotes <= 0 || upvotes <= 0) return 0
  const magnitude = upvotes + downvotes
  const balance = upvotes > downvotes ? downvotes / upvotes : upvotes / downvotes
  return magnitude ** balance
}

// Exports:
export default getControversyScore
