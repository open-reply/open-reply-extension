// Functions:
/**
 * It generates a time-independent popularity scrore, useful for `OrderBy.Popular`.
 * 
 * The original confidence sort algorithm is implemented in [_sorts.pyx](https://github.com/reddit/reddit/blob/master/r2/r2/lib/db/_sorts.pyx).
 * 
 * Randall has a great example of how the confidence sort ranks comments [in his blog post](http://blog.reddit.com/2009/10/reddits-new-comment-sorting-system.html):
 * > If a comment has one upvote and zero downvotes, it has a 100% upvote rate, but since there’s not very much data, the system will keep it near the bottom. But if it has 10 upvotes and only 1 downvote, the system might have enough confidence to place it above something with 40 upvotes and 20 downvotes — figuring that by the time it’s also gotten 40 upvotes, it’s almost certain it will have fewer than 20 downvotes. And the best part is that if it’s wrong (which it is 15% of the time), it will quickly get more data, since the comment with less data is near the top.
 * 
 * The great thing about the confidence sort is that submission time is irrelevant (much unlike the hot sort or Hacker News’s ranking algorithm). Comments are ranked by confidence and by data sampling — i.e. the more votes a comment gets the more accurate its score will become.
 */
const getWilsonScoreInterval = (upvotes: number, downvotes: number) => {
  // The total number of ratings
  const n = upvotes + downvotes
  if (n === 0) return 0

  // 80% confidence
  const z = 1.281551565545

  // The observed fraction of positive ratings
  const p = upvotes / n

  // Building the equation
  const left = p + (1 / (2 * n)) * (z ** 2)
  const right = z * Math.sqrt(((p * (1 - p)) / n )+ ((z ** 2) / (4 * (n ** 2))))
  const under = 1 + (1 / n) * (z ** 2)

  return (left - right) / under
}

// Exports:
export default getWilsonScoreInterval
