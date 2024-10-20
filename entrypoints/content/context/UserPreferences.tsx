// Packages:
import React, { createContext, useState, useEffect } from 'react'
import { useToast } from '../components/ui/use-toast'
import { cloneDeep } from 'lodash'
import { setUserPreferences } from '../firebase/firestore-database/user-preferences/set'
import { getCachedUserPrerences } from '@/entrypoints/background/localforage/user-preferences'
import { getUserPreferences } from '../firebase/firestore-database/user-preferences/get'
import useAuth from '../hooks/useAuth'

// Typescript:
import {
  Theme,
  UnsafeContentPolicy,
  UnsafeWebsitePreviewsPolicy,
  Visibility,
  type UserPreferences,
  WebsiteFlagBannerPosition,
} from 'types/user-preferences'
import type { Local } from '@/entrypoints/background/localforage'
import { type DeepRequired, FetchPolicy } from 'types'
import type { UID } from 'types/user'
import { WebsiteRiskLevel } from 'utils/websiteFlagInfo'

export type UserPreferencesContextType = DeepRequired<UserPreferences> & {
  isLoading: boolean
  loadUserPreferences: () => Promise<void>
  setWebsiteWarningEnabled: (enabled: boolean) => Promise<void>
  setWebsiteWarningWarnAt: (warnAt: WebsiteRiskLevel) => Promise<void>
  setWebsiteWarningPosition: (position: WebsiteFlagBannerPosition) => Promise<void>
  setCheckOwnCommentForOffensiveSpeech: (shouldCheck: boolean) => Promise<void>
  setUnsafeContentPolicy: (unsafeContentPolicy: UnsafeContentPolicy) => Promise<void>
  setUnsafeWebsitePreviewsPolicy: (unsafeWebsitePreviewsPolicy: UnsafeWebsitePreviewsPolicy) => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  setVisibility: (visibility: Visibility) => Promise<void>
}

// Constants:
import { DEFAULT_USER_PREFERENCES } from 'constants/database/user-preferences'

// Context:
export const UserPreferencesContext = createContext<UserPreferencesContextType>({
  isLoading: true,
  ...DEFAULT_USER_PREFERENCES,
  loadUserPreferences: async () => {},
  setWebsiteWarningEnabled: async () => {},
  setWebsiteWarningWarnAt: async () => {},
  setWebsiteWarningPosition: async () => {},
  setCheckOwnCommentForOffensiveSpeech: async () => {},
  setUnsafeContentPolicy: async () => {},
  setUnsafeWebsitePreviewsPolicy: async () => {},
  setTheme: async () => {},
  setVisibility: async () => {},
})

// Exports:
export const UserPreferencesContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const { toast } = useToast()
  const {
    isAccountFullySetup,
    isLoading: isAuthLoading,
    isSignedIn,
    user,
  } = useAuth()

  // State:
  const [isLoading, setIsLoading] = useState(false)
  const [_userPreferencesLoadedForUID, _setUserPreferencesLoadedForUID] = useState<UID | null>(null)
  const [safety, _setSafety] = useState(DEFAULT_USER_PREFERENCES.safety)
  const [moderation, _setModeration] = useState(DEFAULT_USER_PREFERENCES.moderation)
  const [appearance, _setAppearance] = useState(DEFAULT_USER_PREFERENCES.appearance)

  // Functions:
  /**
   * Load the user preferences from cache on start, and then make a network call.
   */
  const loadUserPreferences = async () => {
    let preNetworkCachedUserPreferencesError: Error | null = null
    try {
      setIsLoading(true)
      if (
        !isAuthLoading &&
        isSignedIn &&
        isAccountFullySetup
      ) {
        setIsLoading(true)
        const preNetworkCachedUserPreferences = await getUserPreferences({ fetchPolicy: FetchPolicy.CacheAndNetwork })

        if (preNetworkCachedUserPreferences.status) {
          _setSafety(_safety => ({
            ..._safety,
            ...preNetworkCachedUserPreferences.payload.safety,
            websiteWarning: {
              ..._safety.websiteWarning,
              ...preNetworkCachedUserPreferences.payload.safety?.websiteWarning,
            }
          }))
          _setModeration(_moderation => ({
            ..._moderation,
            ...preNetworkCachedUserPreferences.payload.moderation,
          }))
          _setAppearance(_appearance => ({
            ..._appearance,
            ...preNetworkCachedUserPreferences.payload.appearance,
          }))
        } else preNetworkCachedUserPreferencesError = preNetworkCachedUserPreferences.payload

        const latestCachedUserPreferences = await getUserPreferences({ fetchPolicy: FetchPolicy.CacheOnly })
        if (!latestCachedUserPreferences.status) {
          if (!preNetworkCachedUserPreferences.status) throw latestCachedUserPreferences.payload
        } else {
          _setSafety(_safety => ({
            ..._safety,
            ...latestCachedUserPreferences.payload.safety,
            websiteWarning: {
              ..._safety.websiteWarning,
              ...latestCachedUserPreferences.payload.safety?.websiteWarning,
            }
          }))
          _setModeration(_moderation => ({
            ..._moderation,
            ...latestCachedUserPreferences.payload.moderation,
          }))
          _setAppearance(_appearance => ({
            ..._appearance,
            ...latestCachedUserPreferences.payload.appearance,
          }))
        }
        _setUserPreferencesLoadedForUID(user?.uid ?? null)
      } else {
        toast({
          title: 'Please login to continue!',
          description: 'Please login to view your preferences.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      logError({
        functionName: 'loadUserPreferences',
        data: null,
        error: {
          preNetworkCached: preNetworkCachedUserPreferencesError,
          latestCached: error as unknown as Error,
        },
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to get your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Enable or disable the website warning banner.
   */
  const setWebsiteWarningEnabled = async (enabled: boolean) => {
    const _oldSafety = cloneDeep(safety)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        safety: {
          ...cachedUserPreferences.safety,
          websiteWarning: {
            ...cachedUserPreferences.safety?.websiteWarning,
            enabled,
          },
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setSafety(_safety => ({
        ..._safety,
        ..._userPreferences.safety,
        websiteWarning: {
          ..._safety.websiteWarning,
          ..._userPreferences.safety?.websiteWarning,
        },
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setSafety(_oldSafety)

      logError({
        functionName: 'setWebsiteWarningEnabled',
        data: enabled,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Set the risk level at which the website warning banner should be displayed.
   */
  const setWebsiteWarningWarnAt = async (warnAt: WebsiteRiskLevel) => {
    const _oldSafety = cloneDeep(safety)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        safety: {
          ...cachedUserPreferences.safety,
          websiteWarning: {
            ...cachedUserPreferences.safety?.websiteWarning,
            warnAt,
          },
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setSafety(_safety => ({
        ..._safety,
        ..._userPreferences.safety,
        websiteWarning: {
          ..._safety.websiteWarning,
          ..._userPreferences.safety?.websiteWarning,
        },
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setSafety(_oldSafety)

      logError({
        functionName: 'setWebsiteWarningWarnAt',
        data: warnAt,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Set the position of the website warning banner.
   */
  const setWebsiteWarningPosition = async (position: WebsiteFlagBannerPosition) => {
    const _oldSafety = cloneDeep(safety)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        safety: {
          ...cachedUserPreferences.safety,
          websiteWarning: {
            ...cachedUserPreferences.safety?.websiteWarning,
            position,
          },
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setSafety(_safety => ({
        ..._safety,
        ..._userPreferences.safety,
        websiteWarning: {
          ..._safety.websiteWarning,
          ..._userPreferences.safety?.websiteWarning,
        },
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setSafety(_oldSafety)

      logError({
        functionName: 'setWebsiteWarningPosition',
        data: position,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * set the policy for checked own comment for hate speech for the user.
   */
  const setCheckOwnCommentForOffensiveSpeech = async (checkOwnCommentForOffensiveSpeech: boolean) => {
    const _oldModeration = cloneDeep(moderation)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        moderation: {
          ...cachedUserPreferences.moderation,
          checkOwnCommentForOffensiveSpeech,
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setModeration(_moderation => ({
        ..._moderation,
        ..._userPreferences.moderation,
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setModeration(_oldModeration)

      logError({
        functionName: 'setCheckOwnCommentForOffensiveSpeech',
        data: checkOwnCommentForOffensiveSpeech,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * set the unsafe content policy for the user.
   */
  const setUnsafeContentPolicy = async (unsafeContentPolicy: UnsafeContentPolicy) => {
    const _oldModeration = cloneDeep(moderation)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        moderation: {
          ...cachedUserPreferences.moderation,
          unsafeContentPolicy,
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setModeration(_moderation => ({
        ..._moderation,
        ..._userPreferences.moderation,
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setModeration(_oldModeration)

      logError({
        functionName: 'setUnsafeContentPolicy',
        data: unsafeContentPolicy,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * set the unsafe website preview policy for the user.
   */
  const setUnsafeWebsitePreviewsPolicy = async (unsafeWebsitePreviewsPolicy: UnsafeWebsitePreviewsPolicy) => {
    const _oldModeration = cloneDeep(moderation)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        moderation: {
          ...cachedUserPreferences.moderation,
          unsafeWebsitePreviewsPolicy,
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setModeration(_moderation => ({
        ..._moderation,
        ..._userPreferences.moderation,
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setModeration(_oldModeration)

      logError({
        functionName: 'setUnsafeWebsitePreviewsPolicy',
        data: unsafeWebsitePreviewsPolicy,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Set the theme of the extension and webapp.
   */
  const setTheme = async (theme: Theme) => {
    const _oldAppearance = cloneDeep(appearance)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        appearance: {
          ...cachedUserPreferences.appearance,
          theme,
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setAppearance(_appearance => ({
        ..._appearance,
        ..._userPreferences.appearance,
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setAppearance(_oldAppearance)

      logError({
        functionName: 'setTheme',
        data: theme,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Set the visibility of the extension.
   */
  const setVisibility = async (visibility: Visibility) => {
    const _oldAppearance = cloneDeep(appearance)

    try {
      setIsLoading(true)
      const cachedUserPreferences = await getCachedUserPrerences()
      const _userPreferences = {
        ...cachedUserPreferences,
        appearance: {
          ...cachedUserPreferences.appearance,
          visibility,
        },
      } as Local<UserPreferences>
      delete _userPreferences._lastUpdatedLocally

      _setAppearance(_appearance => ({
        ..._appearance,
        ..._userPreferences.appearance,
      }))

      const { status, payload } = await setUserPreferences({ userPreferences: _userPreferences as UserPreferences })
      if (!status) throw payload

      toast({
        title: 'Preferences updated!',
        description: 'We\'ve updated your preferences.',
      })
    } catch (error) {
      _setAppearance(_oldAppearance)

      logError({
        functionName: 'setVisibility',
        data: visibility,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Failed to set your preferences, please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Effects:
  useEffect(() => {
    if (
      !isAuthLoading &&
      isSignedIn &&
      isAccountFullySetup &&
      _userPreferencesLoadedForUID !== user?.uid
    ) loadUserPreferences()
  }, [
    isAuthLoading,
    isSignedIn,
    isAccountFullySetup,
    _userPreferencesLoadedForUID,
  ])

  // Return:
  return (
    <UserPreferencesContext.Provider
      value={{
        isLoading,
        safety,
        moderation,
        appearance,
        loadUserPreferences,
        setWebsiteWarningEnabled,
        setWebsiteWarningWarnAt,
        setWebsiteWarningPosition,
        setCheckOwnCommentForOffensiveSpeech,
        setUnsafeContentPolicy,
        setUnsafeWebsitePreviewsPolicy,
        setTheme,
        setVisibility,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}
