// Typescript:
import { WebsiteFlagReason } from 'types/websites'

// Exports:
export const HARMFUL_WEBSITE_REASON_WEIGHTS: Record<WebsiteFlagReason, number> = {
  [WebsiteFlagReason.PHISHING]: 1.5,
  [WebsiteFlagReason.SCAM]: 1.5,
  [WebsiteFlagReason.MALWARE]: 2.0,
  [WebsiteFlagReason.FAKE_NEWS]: 1.2,
  [WebsiteFlagReason.AI_GENERATED_CONTENT]: 1.2,
  [WebsiteFlagReason.MISINFORMATION]: 1.2,
  [WebsiteFlagReason.HATE_SPEECH]: 1.3,
  [WebsiteFlagReason.VIOLENCE]: 1.4,
  [WebsiteFlagReason.ILLEGAL_CONTENT]: 1.8,
  [WebsiteFlagReason.COPYRIGHT_INFRINGEMENT]: 1.1,
  [WebsiteFlagReason.EXPLICIT_CONTENT]: 1.2,
  [WebsiteFlagReason.SPAM]: 1.0,
  [WebsiteFlagReason.IDENTITY_THEFT]: 1.7,
  [WebsiteFlagReason.FINANCIAL_FRAUD]: 1.6,
  [WebsiteFlagReason.CYBERBULLYING]: 1.3,
  [WebsiteFlagReason.PRIVACY_VIOLATION]: 1.4,
  [WebsiteFlagReason.IMPERSONATION]: 1.5,
  [WebsiteFlagReason.HARMFUL_DOWNLOADS]: 1.9,
  [WebsiteFlagReason.UNAUTHORIZED_DATA_COLLECTION]: 1.3,
  [WebsiteFlagReason.DECEPTIVE_MARKETING]: 1.2,
  [WebsiteFlagReason.EXTREMISM]: 1.5,
  [WebsiteFlagReason.SELF_HARM_PROMOTION]: 1.6,
  [WebsiteFlagReason.DRUG_TRAFFICKING]: 1.7,
  [WebsiteFlagReason.COUNTERFEIT_GOODS]: 1.2,
  [WebsiteFlagReason.UNETHICAL_PRACTICES]: 1.1,
  [WebsiteFlagReason.OTHER]: 1.0
}

/**
 * The minimum delta between old score and new score, beyond which the old score is updated.
 */
export const WEBSITE_TOPIC_SCORE_DELTA = 1
