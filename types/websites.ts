// Imports:
import { type FieldValue } from 'firebase/firestore'
import type { UID } from './user'

// Exports:
/**
 * The URLHash is a SHA512 hash of a URL (except fragments).
 * 
 * It is the unique `id` for websites. It can be generated using the `getURLHash` function in `utils/getURLHash`.
 */
export type URLHash = string

/**
 * Defines the WebsiteFlagID, only useful for development.
 */
export type WebsiteFlagID = string

/**
 * The `WebsiteFlagReason` is a list of all the reasons a website can be flagged as harmful.
 */
export enum WebsiteFlagReason {
  PHISHING = 'PHISHING',
  SCAM = 'SCAM',
  MALWARE = 'MALWARE',
  FAKE_NEWS = 'FAKE_NEWS',
  AI_GENERATED_CONTENT = 'AI_GENERATED_CONTENT',
  MISINFORMATION = 'MISINFORMATION',
  HATE_SPEECH = 'HATE_SPEECH',
  VIOLENCE = 'VIOLENCE',
  ILLEGAL_CONTENT = 'ILLEGAL_CONTENT',
  COPYRIGHT_INFRINGEMENT = 'COPYRIGHT_INFRINGEMENT',
  EXPLICIT_CONTENT = 'EXPLICIT_CONTENT',
  SPAM = 'SPAM',
  IDENTITY_THEFT = 'IDENTITY_THEFT',
  FINANCIAL_FRAUD = 'FINANCIAL_FRAUD',
  CYBERBULLYING = 'CYBERBULLYING',
  PRIVACY_VIOLATION = 'PRIVACY_VIOLATION',
  IMPERSONATION = 'IMPERSONATION',
  HARMFUL_DOWNLOADS = 'HARMFUL_DOWNLOADS',
  UNAUTHORIZED_DATA_COLLECTION = 'UNAUTHORIZED_DATA_COLLECTION',
  DECEPTIVE_MARKETING = 'DECEPTIVE_MARKETING',
  EXTREMISM = 'EXTREMISM',
  SELF_HARM_PROMOTION = 'SELF_HARM_PROMOTION',
  DRUG_TRAFFICKING = 'DRUG_TRAFFICKING',
  COUNTERFEIT_GOODS = 'COUNTERFEIT_GOODS',
  UNETHICAL_PRACTICES = 'UNETHICAL_PRACTICES',
  OTHER = 'OTHER'
}

/**
 * The `WebsiteFlag` interface defines a flag made against a website.
 */
export interface WebsiteFlag {
  /**
   * The unique `id` of the flag, generated using UUID V4.
   */
  id: WebsiteFlagID

  /**
   * The UID of the user that flagged the website.
   */
  flagger: UID

  /**
   * The reason behind the flag. Can be one of `HARMFUL_WEBSITE_REASON_WEIGHTS`.
   */
  reason: WebsiteFlagReason

  /**
   * Timestamp for when the website was flagged.
   */
  flaggedAt: FieldValue
}

/**
 * The `WebsiteFlagInfo` interface defines flag details made against a website in the Realtime Database.
 */
export interface RealtimeDatabaseWebsiteFlagInfo {
  /**
   * A distribution of flag reasons assigned to a website by users.
   * 
   * This value may get churned over if the calculated `riskScore` evaluates to `WebsiteRiskLevel.LOW`, and it has been `MAXIMUM_DAYS_BEFORE_CHURN` days since the last report.
   * 
   * @optional
   */
  flagDistribution?: Record<WebsiteFlagReason, number>

  /**
   * The cumulative weighted sum of all the flags given to a website by users.
   * 
   * This value may get churned over if the calculated `riskScore` evaluates to `WebsiteRiskLevel.LOW`, and it has been `MAXIMUM_DAYS_BEFORE_CHURN` days since the last report.
   * 
   * @optional
   */
  flagsCumulativeWeight?: number

  /**
   * Keeps a count of all the flags that have been made to this website.
   * 
   * This value may get churned over if the calculated `riskScore` evaluates to `WebsiteRiskLevel.LOW`, and it has been `MAXIMUM_DAYS_BEFORE_CHURN` days since the last report.
   */
  flagCount?: number

  /**
   * The UNIX Timestamp in milliseconds recording the first time the website was flagged.
   * 
   * This value may get churned over if the calculated `riskScore` evaluates to `WebsiteRiskLevel.LOW`, and it has been `MAXIMUM_DAYS_BEFORE_CHURN` days since the last report.
   */
  firstFlagTimestamp: number

  /**
   * The UNIX Timestamp in milliseconds recording the last time the website was flagged.
   * 
   * This value may get churned over if the calculated `riskScore` evaluates to `WebsiteRiskLevel.LOW`, and it has been `MAXIMUM_DAYS_BEFORE_CHURN` days since the last report.
   */
  lastFlagTimestamp: number

  /**
   * The impression received by the website after the last flag. It's set to 0 after every new flag.
   */
  impressionsSinceLastFlag: number
}
