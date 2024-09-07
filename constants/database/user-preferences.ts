// Typescript:
import { WebsiteRiskLevel } from 'utils/websiteFlagInfo'
import {
  Theme,
  UnsafeContentPolicy,
  UnsafeWebsitePreviewsPolicy,
  type UserPreferences,
  Visibility,
  WebsiteFlagBannerPosition,
} from 'types/user-preferences'
import type { DeepRequired } from 'types'

// Exports:
export const DEFAULT_USER_PREFERENCES = {
  safety: {
    websiteWarning: {
      enabled: true,
      warnAt: WebsiteRiskLevel.MODERATE,
      position: WebsiteFlagBannerPosition.Bottom,
    },
  },
  moderation: {
    checkOwnCommentForOffensiveSpeech: true,
    unsafeContentPolicy: UnsafeContentPolicy.BlurUnsafeContent,
    unsafeWebsitePreviewsPolicy: UnsafeWebsitePreviewsPolicy.BlurUnsafeWebsitePreviews,
  },
  appearance: {
    theme: Theme.System,
    visibility: Visibility.BubbleOnBottomRight,
  },
} as DeepRequired<UserPreferences>
