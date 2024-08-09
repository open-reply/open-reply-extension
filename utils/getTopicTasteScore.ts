// Constants:
import { TOPIC_MAX_INTERACTIONS_NEEDED_FOR_THIRD_QUARTILE_CONFIDENCE } from 'constants/database/taste'

// Functions:
/**
 * Get the topic interest score ∈ [0, 100], based on certain parameters.
 * 
 * **LaTeX**:
 * ```LaTeX
 * y=100\ \cdot\ \left(1-e^{\left(-\frac{e^{\frac{1}{3}}x}{500}\right)}\right)
 * ```
 */
const getTopicTasteScore = ({
  upvotes,
  downvotes,
  notInterested,
}: {
  upvotes: number
  downvotes: number
  notInterested: number
}) => {
  const weights = {
    upvote: 1.5,
    downvote: 1,
  }

  const voteScore = weights.upvote * upvotes + weights.downvote * downvotes
  const normalizedScore = voteScore / Math.exp(notInterested)

  return 100 * (
    1 - Math.exp(
      -1 * (
        (Math.exp(1 / 3) * normalizedScore)
        /
        TOPIC_MAX_INTERACTIONS_NEEDED_FOR_THIRD_QUARTILE_CONFIDENCE
      )
    )
  )
}

// Exports:
export default getTopicTasteScore
