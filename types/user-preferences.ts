// Typescript:
import type { WebsiteRiskLevel } from 'utils/websiteFlagInfo'

// Exports:
/**
 * Defines where the safety banner for a website will be displayed.
 */
export enum WebsiteFlagBannerPosition {
  Bottom = 'Bottom',
  Top = 'Top',
}

/**
 * Preferences concerning the user's safety on the internet.
 */
export interface UserPreferencesSafety {
  /**
   * If enabled, a sticky banner is shown at the bottom of the page.
   */
  websiteWarning?: {
    /**
     * Whether the website safe banner is enabled or not.
     * 
     * Default: true
     */
    enabled: boolean

    /**
     * At which risk level should the banner be displayed.
     * 
     * Default: WebsiteRiskLevel.MODERATE
     */
    warnAt: WebsiteRiskLevel

    /**
     * The position of the banner.
     * 
     * Default: WebsiteFlagBannerPosition.Bottom
     */
    position?: WebsiteFlagBannerPosition
  }
}

/**
 * Policy to deal with unsafe content.
 */
export enum UnsafeContentPolicy {
  BlurUnsafeContent = 'BlurUnsafeContent',
  ShowAll = 'ShowAll',
  FilterUnsafeContent = 'FilterUnsafeContent',
}

/**
 * Policy to deal with unsafe website previews.
 */
export enum UnsafeWebsitePreviewsPolicy {
  BlurUnsafeWebsitePreviews = 'BlurUnsafeWebsitePreviews',
  ShowAllWebsitePreviews = 'ShowAllWebsitePreviews',
  FilterUnsafeWebsitePreviews = 'FilterUnsafeWebsitePreviews',
}

/**
 * User preferences for content moderation.
 */
export interface UserPreferencesModeration {
  /**
   * If enabled, the user's comment is checked for offensive speech prior to posting.
   * 
   * This is enabled by default.
   */
  checkOwnCommentForOffensiveSpeech?: boolean

  /**
   * Dictates the policy for dealing with unsafe content.
   * 
   * Default: UnsafeContentPolicy.BlurUnsafeContent
   */
  unsafeContentPolicy?: UnsafeContentPolicy

  /**
   * Dictates the policy for dealing with unsafe website's previews in the feed.
   * 
   * Default: UnsafeWebsitePreviewsPolicy.BlurUnsafeWebsitePreviews
   */
  unsafeWebsitePreviewsPolicy?: UnsafeWebsitePreviewsPolicy
}

/**
 * Theme for the extension and webapp.
 */
export enum Theme {
  Light = 'Light',
  Dark = 'Dark',
  System = 'System',
}

/**
 * Determines the visibility for the extension.
 */
export enum Visibility {
  ShowTopComment = 'ShowTopComment',
  BubbleOnBottomRight = 'BubbleOnBottomRight',
  NoOverlay = 'NoOverlay',
  BubbleOnBottomLeft = 'BubbleOnBottomLeft',
}

/**
 * User's preferences for the extension and webapp appearance.
 */
export interface UserPreferencesAppearance {
  /**
   * The theme of the extension and webapp.
   * 
   * Default: Theme.System
   */
  theme?: Theme

  /**
   * Determines the visibility for the extension.
   * 
   * Default: Visibility.BubbleOnBottomRight
   */
  visibility?: Visibility
}

// TODO: Parked.
/**
 * The notification policy.
 */
// export interface UserPreferencesNotifications {
  
// }

/**
 * The user's preferences.
 */
export interface UserPreferences {
  safety?: UserPreferencesSafety
  moderation?: UserPreferencesModeration
  appearance?: UserPreferencesAppearance
  // notifications?: UserPreferencesNotifications
}
