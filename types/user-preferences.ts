// Exports:
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
  NoOverlay = 'NoOverlay',
  BubbleOnBottomLeft = 'BubbleOnBottomLeft',
  BubbleOnBottomRight = 'BubbleOnBottomRight',
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
  moderation?: UserPreferencesModeration
  appearance?: UserPreferencesAppearance
  // notifications?: UserPreferencesNotifications
}