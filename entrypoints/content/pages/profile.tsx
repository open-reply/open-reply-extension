// Packages:
import { useRef, useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import useUserPreferences from '../hooks/useUserPreferences'
import useAuth from '../hooks/useAuth'
import logError from 'utils/logError'
import { useToast } from '../components/ui/use-toast'
import { getRDBUser, getUIDFromUsername } from '../firebase/realtime-database/users/get'
import { truncate } from 'lodash'
import pastellify from 'pastellify'
import getPhotoURLFromUID from '../utils/getPhotoURLFromUID'
import { isSignedInUserFollowing } from '../firebase/firestore-database/users/get'
import { followUser, unfollowUser } from '../firebase/firestore-database/users/set'
import { cn } from '../lib/utils'
import { isUserMuted } from '../firebase/realtime-database/muted/get'
import { muteUser, unmuteUser } from '../firebase/realtime-database/muted/set'
import { setUserProfilePicture } from '../firebase/storage/users/set'
import { getUserComments } from '../firebase/firestore-database/comment/get'
import { getUserReplies } from '../firebase/firestore-database/reply/get'
import sleep from 'sleep-promise'
import { uid } from 'uid'

// Typescript:
import { UnsafeContentPolicy } from 'types/user-preferences'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import type { UID } from 'types/user'
import type {
  CommentID,
  Comment as CommentInterface,
  ReplyID,
  Reply as ReplyInterface,
} from 'types/comments-and-replies'

enum Tab {
  Comments = 'Comments',
  Replies = 'Replies',
  Saved = 'Saved',
}

// Imports:
import {
  CameraIcon,
  EllipsisIcon,
  Link2Icon,
} from 'lucide-react'
import LoadingIcon from '../components/primary/LoadingIcon'

// Constants:
import ROUTES from '../routes'

// Components:
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Separator } from '../components/ui/separator'
import CommentStandalone from '../components/tertiary/CommentStandalone'
import ReplyStandalone from '../components/tertiary/ReplyStandalone'
import { ScrollArea } from '../components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Skeleton } from '../components/ui/skeleton'
import FollowersDialog from '../components/secondary/FollowersDialog'
import FollowingDialog from '../components/secondary/FollowingDialog'
import HighlightMentions from '../components/primary/HighlightMentions'
import ScrollEndObserver from '../components/secondary/ScrollEndObserver'

// Functions:
const Profile = () => {
  // Constants:
  const navigate = useNavigate()
  const location = useLocation()
  const { username: targetUsername } = useParams()
  const { moderation } = useUserPreferences()
  const {
    isLoading: isAuthLoading,
    isAccountFullySetup,
    isSignedIn,
    user,
  } = useAuth()
  const { toast } = useToast()
  const MAX_BIO_LINES = 2
  const MAX_BIO_CHARS = 80
  const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024
  const DEFAULT_PROFILE_STATE = {
    isFetchingUserDetails: true,
    isUserViewingOwnProfile: false,
    doesUserExist: null,
    username: null,
    UID: null,
    RDBUSer: null,
    URLs: [],
    targetExternalURL: null,
    isExternalURLConfirmationDialogOpen: false,
    signedInUserFollowsThisUser: null,
    isFollowingOrUnfollowingUser: false,
    isBioExpanded: false,
    shouldTruncateBio: null,
    truncatedBio: null,
    hasSignedInUserMutedUser: null,
    isMutingOrUnmutingUser: false,
    isReportingUser: false,
    localProfilePicture: null,
    isUploadingProfilePicture: false,
    profilePicture: '',
    isFetchingUserComments: false,
    userComments: [],
    _userCommentsFetchCount: 0,
    lastVisibleUserFlatCommentID: null,
    noMoreUserComments: false,
    isFetchingUserReplies: false,
    userReplies: [],
    _userRepliesFetchCount: 0,
    lastVisibleUserFlatReplyID: null,
    noMoreUserReplies: false,
    currentTab: Tab.Comments
  } as {
    isFetchingUserDetails: boolean
    isUserViewingOwnProfile: boolean
    doesUserExist: boolean | null
    username: string | undefined | null
    UID: UID | null
    RDBUSer: RealtimeDatabaseUser | null
    URLs: string[]
    targetExternalURL: string | null
    isExternalURLConfirmationDialogOpen: boolean
    signedInUserFollowsThisUser: boolean | null
    isFollowingOrUnfollowingUser: boolean
    isBioExpanded: boolean
    shouldTruncateBio: boolean | null
    truncatedBio: string | null
    hasSignedInUserMutedUser: boolean | null
    isMutingOrUnmutingUser: boolean
    isReportingUser: boolean
    localProfilePicture: File | null
    isUploadingProfilePicture: boolean
    profilePicture: string
    isFetchingUserComments: boolean
    userComments: CommentInterface[]
    _userCommentsFetchCount: number
    lastVisibleUserFlatCommentID: CommentID | null
    noMoreUserComments: boolean
    isFetchingUserReplies: boolean
    userReplies: ReplyInterface[]
    _userRepliesFetchCount: number
    lastVisibleUserFlatReplyID: ReplyID | null
    noMoreUserReplies: boolean
    currentTab: Tab
  }

  // Ref:
  const instanceID = useRef(uid())
  const headerRef = useRef<HTMLDivElement>(null)
  const currentRoute = useRef(location.pathname)
  const currentTargetUsername = useRef<null | string>(targetUsername || null)
  const profilePictureInputRef = useRef<HTMLInputElement>(null)

  // State:
  const [_isFlushingState, _setIsFlushingState] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(300)
  const [disableScrollEndObserver, setDisableScrollEndObserver] = useState(false)
  const [profileState, setProfileState] = useState(DEFAULT_PROFILE_STATE)
  const [isInitialLoadingComplete, setIsInitialLoadingComplete] = useState({
    comments: false,
    reply: false,
  })

  // Functions:
  const flushState = () => {
    if (_isFlushingState) return
    _setIsFlushingState(true)

    setIsInitialLoadingComplete({
      comments: false,
      reply: false,
    })
    setProfileState(_profileState => ({
      ...DEFAULT_PROFILE_STATE,
      username: _profileState.username,
      isUserViewingOwnProfile: _profileState.isUserViewingOwnProfile,
    }))
    
    _setIsFlushingState(false)
  }

  const fetchUserDetails = async (username: string) => {
    try {
      setProfileState(_profileState => ({
        ..._profileState,
        isFetchingUserDetails: true,
      }))

      const {
        status: getUIDFromUsernameStatus,
        payload: getUIDFromUsernamePayload,
      } = await getUIDFromUsername(username)
      if (!getUIDFromUsernameStatus) throw getUIDFromUsernamePayload

      const _UID = getUIDFromUsernamePayload
      if (!_UID) {
        setProfileState(_profileState => ({
        ..._profileState,
        doesUserExist: false,
      }))
        return
      } else setProfileState(_profileState => ({
        ..._profileState,
        doesUserExist: true,
      }))
      setProfileState(_profileState => ({
        ..._profileState,
        UID: _UID,
      }))

      const {
        status: getRDBUserStatus,
        payload: getRDBUserPayload,
      } = await getRDBUser({ UID: _UID })
      if (!getRDBUserStatus) throw getRDBUserPayload
      setProfileState(_profileState => ({
        ..._profileState,
        RDBUSer: getRDBUserPayload,
      }))
      if (getRDBUserPayload?.URLs) setProfileState(_profileState => ({
        ..._profileState,
        URLs: Object.values(getRDBUserPayload?.URLs ?? []),
      }))
      if (getRDBUserPayload?.bio) {
        const _shouldTruncateBio = getRDBUserPayload.bio.split('\n').length > MAX_BIO_LINES || getRDBUserPayload.bio.length > MAX_BIO_CHARS
        const _truncatedBio = _shouldTruncateBio
          ? getRDBUserPayload.bio.split('\n').slice(0, MAX_BIO_LINES).join('\n').slice(0, MAX_BIO_CHARS)
          : getRDBUserPayload.bio
        setProfileState(_profileState => ({
          ..._profileState,
          shouldTruncateBio: _shouldTruncateBio,
          truncatedBio: _truncatedBio,
        }))
      }
    } catch (error) {
      logError({
        functionName: 'Profile.fetchUserDetails',
        data: username,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: `We could not fetch @${ username }'s profile.`,
        variant: 'destructive',
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isFetchingUserDetails: false,
      }))
    }
  }

  const handleOpenExternalURL = (URL: string) => {
    setProfileState(_profileState => ({
      ..._profileState,
      targetExternalURL: URL,
      isExternalURLConfirmationDialogOpen: true,
    }))
  }

  const _followUser = async () => {
    try {
      if (
        profileState.isFollowingOrUnfollowingUser ||
        isAuthLoading ||
        !isSignedIn ||
        !user ||
        !profileState.RDBUSer ||
        !profileState.UID ||
        profileState.UID === user.uid
      ) return

      setProfileState(_profileState => ({
        ..._profileState,
        isFollowingOrUnfollowingUser: true,
      }))

      const {
        status,
        payload,
      } = await followUser(profileState.UID)
      if (!status) throw payload

      setProfileState(_profileState => ({
        ..._profileState,
        signedInUserFollowsThisUser: true,
      }))

      toast({
        title: `Followed @${ profileState.RDBUSer.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Profile._followUser',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isFollowingOrUnfollowingUser: false,
      }))
    }
  }

  const _unfollowUser = async () => {
    try {
      if (
        profileState.isFollowingOrUnfollowingUser ||
        isAuthLoading ||
        !isSignedIn ||
        !user ||
        !profileState.RDBUSer ||
        !profileState.UID ||
        profileState.UID === user.uid
      ) return

      setProfileState(_profileState => ({
        ..._profileState,
        isFollowingOrUnfollowingUser: true,
      }))

      const {
        status,
        payload,
      } = await unfollowUser(profileState.UID)
      if (!status) throw payload

      setProfileState(_profileState => ({
        ..._profileState,
        signedInUserFollowsThisUser: false,
      }))
      
      toast({
        title: `Unfollowed @${ profileState.RDBUSer.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Profile._unfollowUser',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isFollowingOrUnfollowingUser: false,
      }))
    }
  }

  const editProfile = () => {
    navigate(ROUTES.SETTINGS, { state: { tabIndex: 0 } })
  }

  const checkIsSignedInUserFollowing = async (UID: UID) => {
    try {
      const {
        status,
        payload,
      } = await isSignedInUserFollowing(UID)
      if (!status) throw payload
      setProfileState(_profileState => ({
        ..._profileState,
        isFollowingOrUnfollowingUser: payload,
      }))
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 comment, resulting in too many error toasts.
      logError({
        functionName: 'Profile.checkIsSignedInUserFollowing',
        data: UID,
        error,
      })
    }
  }

  const checkIfSignedInUserHasMuted = async (UID: UID) => {
    try {
      const {
        status,
        payload,
      } = await isUserMuted(UID)
      if (!status) throw payload
      setProfileState(_profileState => ({
        ..._profileState,
        hasSignedInUserMutedUser: payload,
      }))
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 comment, resulting in too many error toasts.
      logError({
        functionName: 'Profile.checkIfSignedInUserHasMuted',
        data: UID,
        error,
      })
    }
  }

  const muteOrUnmuteUser = async () => {
    try {
      if (
        profileState.isMutingOrUnmutingUser ||
        !profileState.UID ||
        !profileState.RDBUSer
      ) return
      setProfileState(_profileState => ({
        ..._profileState,
        isMutingOrUnmutingUser: true,
      }))
      const _muteOrUnmuteUser = profileState.hasSignedInUserMutedUser ? unmuteUser : muteUser

      const {
        status,
        payload,
      } = await _muteOrUnmuteUser(profileState.UID)
      if (!status) throw payload

      setProfileState(_profileState => ({
        ..._profileState,
        hasSignedInUserMutedUser: !profileState.hasSignedInUserMutedUser,
      }))

      toast({
        title: `${profileState.hasSignedInUserMutedUser ? 'Unmuted' : 'Muted'} @${ profileState.RDBUSer.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Profile.muteOrUnmuteUser',
        data: profileState.UID,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isMutingOrUnmutingUser: false,
      }))
    }
  }

  const reportUser = async () => {
    try {
      if (profileState.isReportingUser || !profileState.UID) return
      setProfileState(_profileState => ({
        ..._profileState,
        isReportingUser: true,
      }))

      toast({
        title: 'This is a planned feature!',
      })
    } catch (error) {
      logError({
        functionName: 'Profile.reportUser',
        data: profileState.UID,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isReportingUser: false,
      }))
    }
  }

  const convertLocalPhotoToPNG = async (localProfilePictureFile: File) => {
    if (!localProfilePictureFile) return
    return new Promise<File>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 500
        canvas.height = 500
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context!'))
          return
        }

        let sourceX = 0
        let sourceY = 0
        let sourceWidth = image.width
        let sourceHeight = image.height
        
        const scaleFactor = Math.max(
          500 / sourceWidth,
          500 / sourceHeight,
        )
        let scaledWidth = sourceWidth * scaleFactor
        let scaledHeight = sourceHeight * scaleFactor

        if (scaledWidth > 500) {
          sourceX = (sourceWidth - (500 / scaleFactor)) / 2
          sourceWidth = 500 / scaleFactor
          scaledWidth = 500
        } if (scaledHeight > 500) {
          sourceY = (sourceHeight - (500 / scaleFactor)) / 2
          sourceHeight = 500 / scaleFactor
          scaledHeight = 500
        }

        const destX = (500 - scaledWidth) / 2
        const destY = (500 - scaledHeight) / 2
  
        ctx.drawImage(
          image,
          sourceX, sourceY, sourceWidth, sourceHeight,
          destX, destY, scaledWidth, scaledHeight
        )
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngFile = new File([blob], localProfilePictureFile.name.replace(/\.[^/.]+$/, '.png'), {
              type: 'image/png',
              lastModified: new Date().getTime(),
            })
            resolve(pngFile)
          } else {
            reject(new Error('Blob creation failed!'))
          }
        }, 'image/png')
      }
  
      image.onerror = () => {
        reject(new Error('Image loading failed!'))
      }
  
      image.src = URL.createObjectURL(localProfilePictureFile)
    })
  }

  const uploadProfilePicture = async (localProfilePictureFile: File) => {
    if (
      isAuthLoading ||
      !user ||
      !localProfilePictureFile ||
      !profileState.isUserViewingOwnProfile ||
      profileState.isUploadingProfilePicture
    ) return
    try {
      const imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/svg+xml',
        'image/tiff'
      ]

      setProfileState(_profileState => ({
        ..._profileState,
        localProfilePicture: localProfilePictureFile,
      }))

      const extension = localProfilePictureFile.name.split('.').pop()?.toLowerCase() || ''
      if (!extension) throw new Error('Invalid file!')

      const size = localProfilePictureFile.size
      if (size > MAX_PROFILE_PICTURE_SIZE) throw new Error('Selected image bigger than 5 MB limit!')

      const mimeType = localProfilePictureFile.type
      if (!imageMimeTypes.includes(mimeType)) throw new Error('Please select an image file!')

      setProfileState(_profileState => ({
        ..._profileState,
        isUploadingProfilePicture: true,
      }))

      // NOTE: Conversion to PNG
      let file = localProfilePictureFile
      if (extension !== 'png') {
        try {
          file = await convertLocalPhotoToPNG(localProfilePictureFile) as File
        } catch (error) {
          throw error
        }
      }

      const {
        status,
        payload,
      } = await setUserProfilePicture({
        profilePicture: file,
      })
      if (!status) throw payload

      setProfileState(_profileState => ({
        ..._profileState,
        profilePicture: payload,
      }))
      toast({
        title: 'Profile picture has been updated successfully!',
      })
    } catch (error) {
      setProfileState(_profileState => ({
        ..._profileState,
        localProfilePicture: null,
      }))

      logError({
        functionName: 'Profile.uploadProfilePicture',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: (error as Error).message || "We're currently facing some problems, please try again later!",
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isUploadingProfilePicture: false,
      }))
    }
  }

  const onClickUploadProfilePicture = () => {
    if (
      isAuthLoading ||
      profileState.isUploadingProfilePicture
    ) return
    profilePictureInputRef.current?.click()
  }

  const fetchUserComments = async (initialFetch?: boolean) => {
    try {
      const _instanceID = instanceID.current
      if (!isInitialLoadingComplete.comments) setIsInitialLoadingComplete(_isInitialLoadingComplete => ({
        ..._isInitialLoadingComplete,
        comments: true,
      }))
      setProfileState(_profileState => ({
        ..._profileState,
        isFetchingUserComments: true,
      }))

      // TODO: Remove this for performance gains.
      await sleep(profileState._userCommentsFetchCount * 2000)
      setProfileState(_profileState => ({
        ..._profileState,
        _userCommentsFetchCount: _profileState._userCommentsFetchCount + 1,
      }))

      const {
        status,
        payload,
      } = await getUserComments({
        UID: profileState.UID!,
        lastVisibleID: profileState.lastVisibleUserFlatCommentID,
        resetPointer: initialFetch,
      })

      // If the user has navigated away, don't update the state.
      if (
        location.pathname !== currentRoute.current ||
        _instanceID !== instanceID.current
      ) return

      if (!status) throw payload

      let _noMoreComments = false
      const _lastVisibleID = payload.lastVisibleID

      if (
        _lastVisibleID === null ||
        payload.comments.length === 0
      ) _noMoreComments = true

      setProfileState(_profileState => ({
        ..._profileState,
        lastVisibleUserFlatCommentID: _lastVisibleID,
        userComments: [..._profileState.userComments, ...payload.comments],
        noMoreUserComments: _noMoreComments,
      }))
    } catch (error) {
      logError({
        functionName: 'Profile.fetchUserComments',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isFetchingUserComments: false,
      }))
    }
  }

  const fetchUserReplies = async (initialFetch?: boolean) => {
    try {
      const _instanceID = instanceID.current
      if (!isInitialLoadingComplete.reply) setIsInitialLoadingComplete(_isInitialLoadingComplete => ({
        ..._isInitialLoadingComplete,
        reply: true,
      }))
      setProfileState(_profileState => ({
        ..._profileState,
        isFetchingUserReplies: true,
      }))

      // TODO: Remove this for performance gains.
      await sleep(profileState._userRepliesFetchCount * 2000)
      setProfileState(_profileState => ({
        ..._profileState,
        _userRepliesFetchCount: _profileState._userRepliesFetchCount + 1,
      }))
      
      const {
        status,
        payload,
      } = await getUserReplies({
        UID: profileState.UID!,
        lastVisibleID: profileState.lastVisibleUserFlatReplyID,
        resetPointer: initialFetch,
      })

      // If the user has navigated away, don't update the state.
      if (
        location.pathname !== currentRoute.current ||
        _instanceID !== instanceID.current
      ) return

      if (!status) throw payload

      let _noMoreReplies = false
      const _lastVisibleID = payload.lastVisibleID

      if (
        _lastVisibleID === null ||
        payload.replies.length === 0
      ) _noMoreReplies = true

      setProfileState(_profileState => ({
        ..._profileState,
        lastVisibleUserFlatReplyID: _lastVisibleID,
        userReplies: [..._profileState.userReplies, ...payload.replies],
        noMoreUserReplies: _noMoreReplies,
      }))
    } catch (error) {
      logError({
        functionName: 'Profile.fetchUserReplies',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setProfileState(_profileState => ({
        ..._profileState,
        isFetchingUserReplies: false,
      }))
    }
  }

  const scrollEndReached = async (isVisible: boolean) => {
    try {
      if (!isVisible || disableScrollEndObserver || !profileState.UID) return

      if (
        profileState.currentTab === Tab.Comments &&
        !profileState.noMoreUserComments &&
        !profileState.isFetchingUserComments
      ) {
        setDisableScrollEndObserver(true)
        await fetchUserComments()
      } else if (
        profileState.currentTab === Tab.Replies &&
        !profileState.noMoreUserReplies &&
        !profileState.isFetchingUserReplies
      ) {
        setDisableScrollEndObserver(true)
        await fetchUserReplies()
      }
    } catch (error) {
      logError({
        functionName: 'Profile.scrollEndReached',
        data: null,
        error,
      })
    } finally {
      setDisableScrollEndObserver(false)
    }
  }

  // Effects:
  // If signed in and hasn't setup their account, navigate them to account setup screen.
  useEffect(() => {
    if (
      !isAuthLoading &&
      isSignedIn &&
      !isAccountFullySetup
    ) navigate(ROUTES.SETUP_ACCOUNT)
  }, [
    isAuthLoading,
    isSignedIn,
    isAccountFullySetup
  ])

  // Determine if the user is viewing their own profile, or someone else's.
  useEffect(() => {
    if (
      _isFlushingState ||
      !(
        !isAuthLoading &&
        isSignedIn &&
        user
      )
    ) return
    if (location.pathname === ROUTES.PROFILE) {
      setProfileState(_profileState => ({
        ..._profileState,
        username: user.username,
        isUserViewingOwnProfile: true,
      }))
    } else {
      setProfileState(_profileState => ({
        ..._profileState,
        username: targetUsername,
        isUserViewingOwnProfile: false,
      }))
    }
  }, [
    _isFlushingState,
    location,
    targetUsername,
    isAuthLoading,
    isSignedIn,
    user,
  ])

  // Fetch the user's details.
  useEffect(() => {
    if (!!profileState.username && profileState.doesUserExist === null) {
      fetchUserDetails(profileState.username)
    }
  }, [profileState.username, profileState.doesUserExist])

  // Check if the signed-in user is following the author.
  useEffect(() => {
    if (
      !isAuthLoading &&
      isSignedIn &&
      user &&
      profileState.UID &&
      !profileState.isUserViewingOwnProfile
    ) {
      checkIsSignedInUserFollowing(profileState.UID)
      checkIfSignedInUserHasMuted(profileState.UID)
    }
  }, [
    isAuthLoading,
    isSignedIn,
    user,
    profileState.UID,
    profileState.isUserViewingOwnProfile,
  ])

  // Set the profile picture.
  useEffect(() => {
    if (!isAuthLoading) {
      if (profileState.isUserViewingOwnProfile) {
        if (
          isSignedIn &&
          user
        ) {
          setProfileState(_profileState => ({
            ..._profileState,
            profilePicture: (_profileState.localProfilePicture ?
              URL.createObjectURL(_profileState.localProfilePicture) :
              (user.photoURL ?? getPhotoURLFromUID(user.uid)))
          }))
        }
      } else if (profileState.UID) {
        setProfileState(_profileState => ({
          ..._profileState,
          profilePicture: getPhotoURLFromUID(_profileState.UID!),
        }))
      }
    }
  }, [
    isAuthLoading,
    profileState.isUserViewingOwnProfile,
    isSignedIn,
    user,
    profileState.UID,
    profileState.localProfilePicture,
    getPhotoURLFromUID,
  ])

  // Flush component state if route changes.
  useEffect(() => {
    if (location.pathname === ROUTES.PROFILE) {
      currentTargetUsername.current = null
      if (location.pathname !== currentRoute.current) {
        instanceID.current = uid()
        currentRoute.current = location.pathname
        flushState()
      }
    } else if (
      currentTargetUsername.current !== targetUsername
    ) {
      currentTargetUsername.current = targetUsername || null
      instanceID.current = uid()
      currentRoute.current = location.pathname
      flushState()
    }
  }, [
    currentRoute,
    currentTargetUsername,
    targetUsername,
    location,
  ])

  // Keep track of header height to calculate comments scrollbar height.
  useEffect(() => {
    const element = headerRef?.current
    if (!element) return

    const observer = new ResizeObserver(entries => {
      setHeaderHeight(entries[0].contentRect.height)
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Fetch the initial set of comments.
  useEffect(() => {
    if (!profileState.UID) return
    if (!isInitialLoadingComplete.comments) {
      fetchUserComments(true)
    }
  }, [
    instanceID,
    location.pathname,
    currentRoute,
    profileState.UID,
    isInitialLoadingComplete,
  ])

  // Fetch the initial set of replies.
  useEffect(() => {
    if (!profileState.UID) return
    if (!isInitialLoadingComplete.reply) fetchUserReplies(true)
  }, [
    instanceID,
    location.pathname,
    currentRoute,
    profileState.UID,
    isInitialLoadingComplete,
  ])

  // Return:
  return (
    <>
      <Dialog
        open={profileState.isExternalURLConfirmationDialogOpen}
        onOpenChange={open => {
          setProfileState(_profileState => ({
            ..._profileState,
            isExternalURLConfirmationDialogOpen: open,
          }))
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Navigation</DialogTitle>
            <DialogDescription>
              You are about to leave OpenReply and navigate to an external resource that may be harmful. Are you sure you wish to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='sm:justify-start'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => setProfileState(_profileState => ({
                ..._profileState,
                isExternalURLConfirmationDialogOpen: false,
              }))}
            >
              No
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => {
                if (profileState.targetExternalURL) {
                  window.open(profileState.targetExternalURL, '_blank', 'noopener,noreferrer')
                  setProfileState(_profileState => ({
                    ..._profileState,
                    isExternalURLConfirmationDialogOpen: false,
                  }))
                }
              }}
            >
              Yes, I'm Sure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <main className='flex flex-col w-full h-screen pt-[68px] bg-white text-brand-primary'>
        <div
          ref={headerRef}
          className='flex flex-col w-full'
        >
          <div className='flex flex-row items-start gap-7 w-full p-7'>
            {
              profileState.isFetchingUserDetails ? (
                <div className='w-32 aspect-square'>
                  <Skeleton className='w-full h-full rounded-full' />
                </div>
              ) : (
                <div
                  className={cn(
                    'h-fit relative rounded-full group transition-all duration-500',
                    profileState.isUserViewingOwnProfile && 'cursor-pointer',
                    profileState.isUploadingProfilePicture && 'select-none',
                  )}
                  onClick={onClickUploadProfilePicture}
                >
                  <Avatar
                    className={cn(
                      'w-32 h-32 brightness-100 bg-overlay transition-all',
                      profileState.isUserViewingOwnProfile && 'group-hover:brightness-75',
                      profileState.isUploadingProfilePicture && 'group-brightness-75',
                    )}
                  >
                    <AvatarImage
                      src={profileState.profilePicture}
                      alt={profileState.RDBUSer?.username}
                    />
                    <AvatarFallback
                      className='text-5xl'
                      style={
                        profileState.UID ? {
                          backgroundColor: pastellify(profileState.UID, { toCSS: true })
                        } : {}
                      }
                    >
                      { profileState.RDBUSer?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }
                    </AvatarFallback>
                  </Avatar>
                  {
                    profileState.isUserViewingOwnProfile && (
                      <>
                        {
                          profileState.isUploadingProfilePicture ? (
                            <div className='absolute left-1/2 top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-1/2'>
                              <LoadingIcon className='w-9 h-9 text-white' />
                            </div>
                          ) : (
                            <CameraIcon
                              className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-auto text-white opacity-0 group-hover:opacity-100 transition-all'
                            />
                          )
                        }
                      </>
                    )
                  }
                </div>
              )
            }
            <div className='w-[calc(100%-4rem-1.75rem-1.75rem-1.75rem)] flex flex-col gap-3'>
              <div className='flex flex-row justify-between'>
                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    {
                      (profileState.isFetchingUserDetails || !profileState.RDBUSer) ?
                        <Skeleton className='h-6 my-1 w-48' /> :
                      (
                        <h1 className='text-xl text-brand-primary font-bold'>{ profileState.RDBUSer.fullName }</h1>
                      )
                    }
                    {(!profileState.isFetchingUserDetails && profileState.signedInUserFollowsThisUser) && (
                      <span className='text-xs bg-overlay text-brand-tertiary px-2 py-1 rounded-full'>
                        Follows you
                      </span>
                    )}
                  </div>
                  {
                    (profileState.isFetchingUserDetails || !profileState.RDBUSer) ?
                      <Skeleton className='h-3.5 my-0.5 w-24' /> :
                    (
                      <h4 className='text-sm text-brand-tertiary'>@{ profileState.RDBUSer?.username }</h4>
                    )
                  }
                </div>
                <div className='flex flex-row gap-2'>
                  {
                    (!isAuthLoading && isSignedIn && user && profileState.UID) && (
                      <>
                        {
                          (user.uid === profileState.UID && profileState.isUserViewingOwnProfile) ? (
                            <Button
                              variant='default'
                              className='h-8'
                              onClick={editProfile}
                            >
                              Edit Profile
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant={profileState.signedInUserFollowsThisUser ? 'outline' : 'default'}
                                className='h-8'
                                onClick={profileState.signedInUserFollowsThisUser ? _unfollowUser : _followUser}
                                disabled={
                                  profileState.isFollowingOrUnfollowingUser ||
                                  isAuthLoading ||
                                  !isSignedIn ||
                                  !user ||
                                  !profileState.RDBUSer ||
                                  !profileState.UID ||
                                  profileState.UID === user.uid
                                }
                              >
                                {profileState.signedInUserFollowsThisUser ? 'Unfollow' : 'Follow'}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant='outline' className='h-8 w-8 p-0'>
                                    <EllipsisIcon size={18} strokeWidth={1} className='fill-brand-primary' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    className='text-xs font-medium cursor-pointer'
                                    onClick={muteOrUnmuteUser}
                                    disabled={profileState.isMutingOrUnmutingUser}
                                  >
                                    { profileState.hasSignedInUserMutedUser ? 'Unmute' : 'Mute' }
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className='text-rose-600 text-xs font-medium cursor-pointer hover:!bg-rose-200 hover:!text-rose-600'
                                    onClick={reportUser}
                                  >
                                    Report
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )
                        }
                      </>
                    )
                  }
                </div>
              </div>
              {
                profileState.isFetchingUserDetails ? (
                  <div className='flex flex-col gap-1.5 w-full'>
                    <Skeleton className='h-3.5 w-full' />
                    <Skeleton className='h-3.5 w-1/3' />
                  </div>
                ) : (
                  <div className='text-sm'>
                    {
                      (profileState.RDBUSer?.bio ?? '').trim().length > 0 ? (
                        <>
                          <pre className='whitespace-pre-wrap font-sans'>
                            {
                              profileState.shouldTruncateBio ?
                                profileState.isBioExpanded ? (
                                  <HighlightMentions
                                    text={profileState.RDBUSer?.bio ?? ''}
                                    onMentionClick={mention => navigate(`/u/${mention}`)}
                                  />
                                ) : profileState.truncatedBio : (
                                  <HighlightMentions
                                    text={profileState.RDBUSer?.bio ?? ''}
                                    onMentionClick={mention => navigate(`/u/${mention}`)}
                                  />
                                )
                            }
                            {profileState.shouldTruncateBio && !profileState.isBioExpanded && '...'}
                          </pre>
                          {profileState.shouldTruncateBio && (
                            <button
                              onClick={() => setProfileState(_profileState => ({
                                ..._profileState,
                                isBioExpanded: !_profileState.isBioExpanded,
                              }))}
                              className='font-semibold text-brand-secondary hover:underline'
                            >
                              {profileState.isBioExpanded ? 'Read less' : 'Read more'}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className='text-brand-tertiary italic select-none'>
                          {
                            profileState.isUserViewingOwnProfile ? (
                              <span
                                className='cursor-pointer hover:underline'
                                onClick={editProfile}
                              >
                                No bio here. Add one?
                              </span>
                            ) : (
                              'No bio here, yet.'
                            )
                          }
                        </div>
                      )
                    }
                  </div>
                )
              }
              <div
                className={cn(
                  'flex flex-row gap-4',
                  profileState.isFetchingUserDetails && 'pointer-events-none',
                )}
              >
                {
                  profileState.isFetchingUserDetails ? (
                    <>
                      <div className='flex items-center flex-row gap-1 text-sm group cursor-pointer'>
                        <span className='font-bold group-hover:underline'>
                          <Skeleton className='w-6 h-4' />
                        </span>
                        <span className='font-normal group-hover:underline'>Followers</span>
                      </div>
                      <div className='flex items-center flex-row gap-1 text-sm group cursor-pointer'>
                        <span className='font-bold group-hover:underline'>
                          <Skeleton className='w-6 h-4' />
                        </span>
                        <span className='font-normal group-hover:underline'>Following</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <FollowersDialog
                        username={profileState.username ? profileState.username : undefined}
                        UID={profileState.UID ? profileState.UID : undefined}
                        disabled={!profileState.UID}
                      >
                        <div className='flex items-center flex-row gap-1 text-sm group cursor-pointer'>
                          <span className='font-bold group-hover:underline'>
                            { (profileState.RDBUSer?.followerCount ?? 0) }
                          </span>
                          <span className='font-normal group-hover:underline'>Followers</span>
                        </div>
                      </FollowersDialog>
                      <FollowingDialog
                        username={profileState.username ? profileState.username : undefined}
                        UID={profileState.UID ? profileState.UID : undefined}
                        disabled={!profileState.UID}
                      >
                        <div className='flex items-center flex-row gap-1 text-sm group cursor-pointer'>
                          <span className='font-bold group-hover:underline'>
                            { (profileState.RDBUSer?.followingCount ?? 0) }
                          </span>
                          <span className='font-normal group-hover:underline'>Following</span>
                        </div>
                      </FollowingDialog>
                    </>
                  )
                }
              </div>
              <div className='flex flex-row gap-4'>
                {
                  profileState.URLs.map((URL, index) => (
                    <div
                      key={`profile-url-${index}`}
                      className='text-sm text-blue font-regular hover:underline cursor-pointer flex flex-row gap-1'
                      onClick={() => handleOpenExternalURL(URL)}
                    >
                      <Link2Icon className='w-3.5 -mt-0.5 text-blue -rotate-[45deg]' strokeWidth={2} /> <p>{truncate(URL, { length: 35 })}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className='flex flex-wrap w-full h-12'>
            <div
              className={cn(
                'flex flex-1 justify-center items-center h-full text-brand-secondary font-medium select-none cursor-pointer hover:bg-overlay transition-all',
                profileState.currentTab === Tab.Comments && 'text-brand-primary font-semibold border-b-4 border-blue',
              )}
              onClick={() => setProfileState(_profileState => ({
                ..._profileState,
                currentTab: Tab.Comments,
              }))}
            >
              Comments
            </div>
            <div
              className={cn(
                'flex flex-1 justify-center items-center h-full text-brand-secondary font-medium select-none cursor-pointer hover:bg-overlay transition-all',
                profileState.currentTab === Tab.Replies && 'text-brand-primary font-semibold border-b-4 border-blue',
              )}
              onClick={() => setProfileState(_profileState => ({
                ..._profileState,
                currentTab: Tab.Replies,
              }))}
            >
              Replies
            </div>
          </div>
        </div>
        <Separator />
        <div
          className='w-full'
          style={{ height: `calc(100vh - ${ headerHeight + 68 }px)` }}
        >
          {
            (
              profileState.isFetchingUserDetails ||
              (
                (profileState.currentTab === Tab.Comments && (!isInitialLoadingComplete.comments || profileState.isFetchingUserComments)) ||
                (profileState.currentTab === Tab.Replies && (!isInitialLoadingComplete.reply || profileState.isFetchingUserReplies))
              )
            ) ? (
              <div className='flex justify-center items-center gap-1.5 w-full h-full select-none'>
                <LoadingIcon className='w-5 h-5 text-brand-primary' aria-hidden='true' />
                <p className='text-sm text-brand-secondary'>Loading { profileState.currentTab === Tab.Comments ? 'comments..' : 'replies..' }</p>
              </div>
            ) : (
              <>
                {
                  (!profileState.isFetchingUserDetails && !profileState.doesUserExist) ? (
                    <div className='flex justify-center items-center flex-col gap-2 w-full h-full select-none'>
                      <h2 className='text-2xl font-bold'>This account does not exist</h2>
                      <p className='text-sm text-brand-secondary font-medium'>Looks like you got baited.</p>
                    </div>
                  ) : (
                    <>
                      <ScrollArea
                        className={cn(
                          'w-full h-full',
                          profileState.currentTab === Tab.Comments ? 'block' : 'hidden',
                        )}
                        hideScrollbar
                      >
                        <div className='flex flex-col gap-4 w-full px-4 pt-7'>
                          {profileState.userComments
                            .filter(
                              comment =>
                                !comment.isDeleted &&
                                !comment.isRemoved &&
                                !comment.isRestricted &&
                                (moderation.unsafeContentPolicy === UnsafeContentPolicy.FilterUnsafeContent
                                  ? !comment.hateSpeech.isHateSpeech
                                  : true)
                            )
                            .map(comment => (
                              <CommentStandalone comment={comment} key={comment.id} />
                            ))}
                        </div>
                        <ScrollEndObserver
                          setIsVisible={scrollEndReached}
                          disabled={disableScrollEndObserver}
                        />
                      </ScrollArea>
                      <ScrollArea
                        className={cn(
                          'w-full h-full',
                          profileState.currentTab === Tab.Replies ? 'block' : 'hidden',
                        )}
                        hideScrollbar
                      >
                        <div className='flex flex-col gap-4 w-full px-4 pt-7'>
                          {profileState.userReplies
                            .filter(
                              reply =>
                                !reply.isDeleted &&
                                !reply.isRemoved &&
                                !reply.isRestricted &&
                                (moderation.unsafeContentPolicy === UnsafeContentPolicy.FilterUnsafeContent
                                  ? !reply.hateSpeech.isHateSpeech
                                  : true)
                            )
                            .map(reply => (
                              <ReplyStandalone reply={reply} key={reply.id} />
                            ))}
                        </div>
                        <ScrollEndObserver
                          setIsVisible={scrollEndReached}
                          disabled={disableScrollEndObserver}
                        />
                      </ScrollArea>
                    </>
                  )
                }
              </>
            )
          }
        </div>
      </main>
      <input
        ref={profilePictureInputRef}
        type='file'
        accept='image/*'
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          zIndex: -1,
        }}
        disabled={isAuthLoading || profileState.isUploadingProfilePicture}
        onChange={event => {
          if (
            event.currentTarget.files &&
            event.currentTarget.files[0]
          ) {
            const file = event.currentTarget.files[0]
            uploadProfilePicture(file)
          } else {
            setProfileState(_profileState => ({
              ..._profileState,
              localProfilePicture: null,
            }))
          }
        }}
      />
    </>
  )
}

// Exports:
export default Profile
