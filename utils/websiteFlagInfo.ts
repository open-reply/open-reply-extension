// Typescript:
export enum WebsiteRiskLevel {
  MINIMAL = 'MINIMAL',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  SEVERE = 'SEVERE',
}

// Constants:
/**
 * The minimum number of impressions required to adjust for websites with low traffic.
 */
const MIN_IMPRESSIONS_FOR_BASE_RISK_SCORE = 1000

/**
 * The maximum number of days for which a flag will be relevant.
 */
const MAX_FLAG_RELEVANCY_PERIOD_DAYS = 90

/**
 * We define a threshold of impressions (e.g., 10,000) that represents a significant amount of "clean" traffic.
 */
const HEALING_THRESHOLD_IMPRESSIONS = 10000

/**
 * We set a time period (e.g., 30 days) over which full healing can occur if the impression threshold is met.
 */
const HEALING_PERIOD = 30

/**
 * This allows the risk score to gradually decrease if no new flags are made, without dropping too quickly.
 */
const SCORE_GRADUAL_DECAY_HALF_LIFE_DAYS = 180

/**
 * The maximum number of days before certain values in `RealtimeDatabaseWebsiteFlagInfo` are "churned"
 * 
 * Note that "churning" only happens when a user submits a new flag, after a long period of quiet and lowering temporal website risk score.
 */
const MAXIMUM_DAYS_BEFORE_CHURN = 180

// Exports:
/**
 * Calculate the time-independent Base Risk Score for a website, given the impressions, cumulative weight of all the flags, and the flag count. The score is capped at 100.
 * 
 * - **Base Risk Score**: We start by calculating `(flagsCumulativeWeight / impressions) * 100`. This gives us a percentage that takes into account both the severity (weight) of the flags and how frequently they occur relative to impressions.
 * - **Flag Frequency Adjustment**: We multiply by `(1 + flagCount / impressions)`. This increases the risk score for websites where a higher proportion of impressions result in flags.
 * - **Low Impression Adjustment**: We divide by `min(1, impressions / MIN_IMPRESSIONS_FOR_BASE_RISK_SCORE)`. This helps prevent outliers for low-traffic websites, similar to our previous implementations.
 */
export const calculateWebsiteBaseRiskScore = ({
  impressions,
  flagsCumulativeWeight,
  flagCount,
}: {
  impressions: number
  flagsCumulativeWeight: number
  flagCount: number
}) => {
  // This is the time-independent, base risk score.
  let baseRiskScore = (flagsCumulativeWeight / impressions) * 100

  // Adjust for flag frequency.
  const flagRatio = flagCount / impressions
  baseRiskScore *= (1 + flagRatio)

  // Adjust for low impression count.
  const impressionFactor = Math.min(1, impressions / MIN_IMPRESSIONS_FOR_BASE_RISK_SCORE)
  baseRiskScore /= impressionFactor

  // Cap the base risk score at 100.
  baseRiskScore = Math.min(baseRiskScore, 100)

  return baseRiskScore
}

/**
 * Calculate the time-dependent Risk Score for a website.
 */
export const calculateTemporalWebsiteRiskScore = ({
  baseRiskScore,
  flagCount,
  firstFlagTimestamp, 
  lastFlagTimestamp, 
  impressionsSinceLastFlag,
  currentTimestamp,
}: {
  baseRiskScore: number
  flagCount: number
  firstFlagTimestamp: number
  lastFlagTimestamp: number
  impressionsSinceLastFlag: number
  currentTimestamp: number
}) => {
  /**
   * Calculate the relevant time periods.\
   * This allows us to distinguish between the active flaging period and the time since the last flag.
   */
  const daysSinceFirstFlag = (currentTimestamp - firstFlagTimestamp) / (24 * 60 * 60 * 1000)
  const daysSinceLastFlag = (currentTimestamp - lastFlagTimestamp) / (24 * 60 * 60 * 1000)

  /**
   * Calculate the healing factor.\
   * The healing factor based on two components:
   * - The number of impressions since the last flag i.e. `impressionsSinceLastFlag`
   * - The time elapsed since the last flag i.e. `daysSinceLastFlag`.
   * 
   * The healing factor reduces the Base Risk Score based on both impressions and time since the last flag.
   */
  const healingProgress = Math.min(impressionsSinceLastFlag / HEALING_THRESHOLD_IMPRESSIONS, 1)
  const timeFactor = Math.min(daysSinceLastFlag / HEALING_PERIOD, 1)
  const healingFactor = 1 - (healingProgress * timeFactor)

  // Adjust risk score based on healing.
  let adjustedBaseScore = baseRiskScore * healingFactor

  /**
   * Calculate the flag frequency.
   * 
   * We calculate flags per day based on the effective timespan, not the entire period since the first flag.
   */
  const effectiveTimespan = Math.min(daysSinceFirstFlag, MAX_FLAG_RELEVANCY_PERIOD_DAYS)
  const flagsPerDay = flagCount / effectiveTimespan

  // Calculate final risk score.
  let finalRiskScore = adjustedBaseScore * Math.log(flagsPerDay + 1)

  /**
   * Apply a gradual decay factor.
   * 
   * We maintain a gradual decay factor, but with a longer half-life to allow for slower natural decay of old reports.
   */
  const decayFactor = Math.exp(-daysSinceLastFlag / SCORE_GRADUAL_DECAY_HALF_LIFE_DAYS)
  finalRiskScore *= decayFactor

  /**
   * Cap the final risk score at 100 and floor at 0.
   * 
   * We ensure the risk score never goes below 0, allowing for complete rehabilitation of the score.
   */
  return Math.max(0, Math.min(finalRiskScore, 100))
}

/**
 * Categorize the numerical risk score as per the `WebsiteRiskLevel` enum.
 */
export const determineWebsiteRiskLevel = (temporalRiskScore: number): WebsiteRiskLevel => {
  if (temporalRiskScore < 1) return WebsiteRiskLevel.MINIMAL
  if (temporalRiskScore < 5) return WebsiteRiskLevel.LOW
  if (temporalRiskScore < 20) return WebsiteRiskLevel.MODERATE
  if (temporalRiskScore < 50) return WebsiteRiskLevel.HIGH
  return WebsiteRiskLevel.SEVERE
}

/**
 * When submitting a new flag, compute this to figure out if the `RealtimeDatabaseWebsiteFlagInfo` values should be churned or not.
 */
export const shouldChurnWebsiteFlagInfo = ({
  temporalRiskScore,
  currentTimestamp,
  lastFlagTimestamp,
}: {
  temporalRiskScore: number
  currentTimestamp: number
  lastFlagTimestamp: number
}) => {
  const riskLevel = determineWebsiteRiskLevel(temporalRiskScore)
  const daysSinceLastFlag = (currentTimestamp - lastFlagTimestamp) / (24 * 60 * 60 * 1000)

  return [
    WebsiteRiskLevel.MINIMAL,
    WebsiteRiskLevel.LOW
  ].includes(riskLevel) && daysSinceLastFlag >= MAXIMUM_DAYS_BEFORE_CHURN
}

/**
 * Should a warning be shown to the user, depending on the current risk level, against the threshold.
 */
export const triggerRiskLevel = ({ current, threshold }: { current: WebsiteRiskLevel, threshold: WebsiteRiskLevel }) => {
  if (threshold === WebsiteRiskLevel.MINIMAL) return true
  else if (threshold === WebsiteRiskLevel.LOW) {
    if (current === WebsiteRiskLevel.MINIMAL) return true
    else if (current === WebsiteRiskLevel.LOW) return true
    else return false
  } else if (threshold === WebsiteRiskLevel.MODERATE) {
    if (current === WebsiteRiskLevel.MINIMAL) return true
    else if (current === WebsiteRiskLevel.LOW) return true
    else if (current === WebsiteRiskLevel.MODERATE) return true
    else return false
  } else if (threshold === WebsiteRiskLevel.HIGH) {
    if (current === WebsiteRiskLevel.MINIMAL) return true
    else if (current === WebsiteRiskLevel.LOW) return true
    else if (current === WebsiteRiskLevel.MODERATE) return true
    else if (current === WebsiteRiskLevel.HIGH) return true
    else return false
  } else if (threshold === WebsiteRiskLevel.SEVERE) {
    if (current === WebsiteRiskLevel.MINIMAL) return true
    else if (current === WebsiteRiskLevel.LOW) return true
    else if (current === WebsiteRiskLevel.MODERATE) return true
    else if (current === WebsiteRiskLevel.HIGH) return true
    else if (current === WebsiteRiskLevel.SEVERE) return true
    else return false
  } else return false
}

export const RISK_LEVEL_VALUE_MAP = {
  [WebsiteRiskLevel.MINIMAL]: 0,
  [WebsiteRiskLevel.LOW]: 25,
  [WebsiteRiskLevel.MODERATE]: 50,
  [WebsiteRiskLevel.HIGH]: 75,
  [WebsiteRiskLevel.SEVERE]: 100,
} as const
