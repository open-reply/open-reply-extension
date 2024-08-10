// Functions:
/**
 * Get the website topic score ∈ [0, 100], based on certain parameters.
 * 
 * **LaTeX**:
 * ```LaTeX
 * y=100\ \cdot\ \left(1-e^{\left(-\frac{e^{\frac{1}{3}}x}{V}\right)}\right)
 * ```
 */
const getWebsiteTopicScore = ({
  upvotes,
  downvotes,
  totalVotesOnCommentsOnWebsite,
}: {
  upvotes: number
  downvotes: number
  totalVotesOnCommentsOnWebsite: number
}) => {
  const delta = upvotes - downvotes

  const finalScore = 100 * (
    1 - Math.exp(
      -1 * (
        (Math.exp(1 / 3) * delta)
        /
        totalVotesOnCommentsOnWebsite
      )
    )
  )

  return isNaN(finalScore) ? 0 : finalScore >= 100 ? 100 : finalScore < 0 ? 0 : finalScore
}

// Exports:
export default getWebsiteTopicScore
