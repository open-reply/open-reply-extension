// Packages:
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

// Typescript:
import { UnsafeContentPolicy } from 'types/user-preferences'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import type { UID } from 'types/user'

// Imports:
import {
  CameraIcon,
  EllipsisIcon,
  Link2Icon,
} from 'lucide-react'

// Constants:
import ROUTES from '../routes'
import { commentFixtures } from '@/fixtures/comment'

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
import Comment from '../components/tertiary/Comment'
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

// Functions:
const Profile = () => {
  // Constants:
  const navigate = useNavigate()
  const location = useLocation()
  const { u: targetUsername } = useParams()
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

  // State:
  const [isFetchingUserDetails, setIsFetchingUserDetails] = useState(true)
  const [username, setUsername] = useState<string | undefined | null>(null)
  const [isUserViewingOwnProfile, setIsUserViewingOwnProfile] = useState(false)
  const [doesUserExist, setDoesUserExist] = useState<boolean | null>(null)
  const [UID, setUID] = useState<string | null>(null)
  const [RDBUSer, setRDBUSer] = useState<RealtimeDatabaseUser | null>(null)
  const [URLs, setURLs] = useState<string[]>([])
  const [targetExternalURL, setTargetExternalURL] = useState<string | null>(null)
  const [isExternalURLConfirmationDialogOpen, setIsExternalURLConfirmationDialogOpen] = useState(false)
  const [signedInUserFollowsThisUser, setSignedInUserFollowsThisUser] = useState<boolean | null>(null)
  const [isFollowingOrUnfollowingUser, setIsFollowingOrUnfollowingUser] = useState(false)
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [shouldTruncateBio, setShouldTruncateBio] = useState<boolean | null>(null)
  const [truncatedBio, setTruncatedBio] = useState<string | null>(null)
  const [hasSignedInUserMutedUser, setHasSignedInUserMutedUser] = useState<boolean | null>(null)
  const [isMutingOrUnmutingUser, setIsMutingOrUnmutingUser] = useState(false)
  const [isReportingUser, setIsReportingUser] = useState(false)

  // Functions:
  const fetchUserDetails = async (username: string) => {
    try {
      setIsFetchingUserDetails(true)
      const {
        status: getUIDFromUsernameStatus,
        payload: getUIDFromUsernamePayload,
      } = await getUIDFromUsername(username)
      if (!getUIDFromUsernameStatus) throw getUIDFromUsernamePayload

      const _UID = getUIDFromUsernamePayload
      if (!_UID) {
        setDoesUserExist(false)
        return
      } else setDoesUserExist(true)
      setUID(_UID)

      const {
        status: getRDBUserStatus,
        payload: getRDBUserPayload,
      } = await getRDBUser({ UID: _UID })
      if (!getRDBUserStatus) throw getRDBUserPayload
      setRDBUSer(getRDBUserPayload)
      if (getRDBUserPayload?.URLs) setURLs(Object.values(getRDBUserPayload?.URLs))
      if (getRDBUserPayload?.bio) {
        const _shouldTruncateBio = getRDBUserPayload.bio.split('\n').length > MAX_BIO_LINES || getRDBUserPayload.bio.length > MAX_BIO_CHARS
        setShouldTruncateBio(_shouldTruncateBio)
        const _truncatedBio = _shouldTruncateBio
          ? getRDBUserPayload.bio.split('\n').slice(0, MAX_BIO_LINES).join('\n').slice(0, MAX_BIO_CHARS)
          : getRDBUserPayload.bio
        setTruncatedBio(_truncatedBio)
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
      setIsFetchingUserDetails(false)
    }
  }

  const handleOpenExternalURL = (URL: string) => {
    setTargetExternalURL(URL)
    setIsExternalURLConfirmationDialogOpen(true)
  }

  const _followUser = async () => {
    try {
      if (
        isFollowingOrUnfollowingUser ||
        isAuthLoading ||
        !isSignedIn ||
        !user ||
        !RDBUSer ||
        !UID ||
        UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await followUser(UID)
      if (!status) throw payload

      setSignedInUserFollowsThisUser(true)
      toast({
        title: `Followed @${ RDBUSer?.username }!`,
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
      setIsFollowingOrUnfollowingUser(false)
    }
  }

  const _unfollowUser = async () => {
    try {
      if (
        isFollowingOrUnfollowingUser ||
        isAuthLoading ||
        !isSignedIn ||
        !user ||
        !RDBUSer ||
        !UID ||
        UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await unfollowUser(UID)
      if (!status) throw payload

      setSignedInUserFollowsThisUser(false)
      toast({
        title: `Unfollowed @${ RDBUSer?.username }!`,
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
      setIsFollowingOrUnfollowingUser(false)
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
      setSignedInUserFollowsThisUser(payload)
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
      setHasSignedInUserMutedUser(payload)
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
      if (isMutingOrUnmutingUser || !UID) return
      setIsMutingOrUnmutingUser(true)
      const _muteOrUnmuteUser = hasSignedInUserMutedUser ? unmuteUser : muteUser

      const {
        status,
        payload,
      } = await _muteOrUnmuteUser(UID)
      if (!status) throw payload

      toast({
        title: `${hasSignedInUserMutedUser ? 'Unmuted' : 'Muted'} @${ RDBUSer?.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Profile.muteOrUnmuteUser',
        data: UID,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsMutingOrUnmutingUser(false)
    }
  }

  const reportUser = async () => {
    try {
      if (isReportingUser || !UID) return
      setIsReportingUser(true)

      toast({
        title: 'This is a planned feature!',
      })
    } catch (error) {
      logError({
        functionName: 'Profile.reportUser',
        data: UID,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsReportingUser(false)
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
    if (location.pathname === ROUTES.PROFILE) {
      if (
        !isAuthLoading &&
        isSignedIn &&
        user
      ) setUsername(user.username)
      setIsUserViewingOwnProfile(true)
    } else {
      setIsUserViewingOwnProfile(false)
      setUsername(targetUsername)
    }
  }, [
    location,
    targetUsername,
    isAuthLoading,
    isSignedIn,
    user,
  ])

  // Fetch the user's details.
  useEffect(() => {
    if (!!username && doesUserExist === null) {
      fetchUserDetails(username)
    }
  }, [username, doesUserExist])

  // Check if the signed-in user is following the author.
  useEffect(() => {
    if (
      !isAuthLoading &&
      isSignedIn &&
      user &&
      UID &&
      !isUserViewingOwnProfile
    ) {
      checkIsSignedInUserFollowing(UID)
      checkIfSignedInUserHasMuted(UID)
    }
  }, [
    isAuthLoading,
    isSignedIn,
    user,
    UID,
    isUserViewingOwnProfile,
  ])

  // Return:
  return (
    <>
      <Dialog open={isExternalURLConfirmationDialogOpen} onOpenChange={setIsExternalURLConfirmationDialogOpen}>
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
              onClick={() => setIsExternalURLConfirmationDialogOpen(false)}
            >
              No
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => {
                if (targetExternalURL) {
                  window.open(targetExternalURL, '_blank', 'noopener,noreferrer')
                  setIsExternalURLConfirmationDialogOpen(false)
                }
              }}
            >
              Yes, I'm Sure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <main className='flex flex-col w-full h-screen pt-[68px] bg-white text-brand-primary'>
        <div className='flex flex-row items-start gap-7 w-full min-h-[18%] p-7'>
          {
            isFetchingUserDetails ? (
              <div className='w-32 aspect-square'>
                <Skeleton className='w-full h-full rounded-full' />
              </div>
            ) : (
              <div
                className={cn(
                  'h-fit relative rounded-full group transition-all duration-500',
                  isUserViewingOwnProfile && 'cursor-pointer',
                )}
              >
                <Avatar
                  className={cn(
                    'w-32 h-32 brightness-100 bg-overlay transition-all',
                    isUserViewingOwnProfile && 'group-hover:brightness-75',
                  )}
                >
                  <AvatarImage
                    src={UID ? getPhotoURLFromUID(UID) : ''}
                    alt={RDBUSer?.username}
                  />
                  <AvatarFallback
                    className='text-5xl'
                    style={
                      UID ? {
                        backgroundColor: pastellify(UID, { toCSS: true })
                      } : {}
                    }
                  >
                    { RDBUSer?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }
                  </AvatarFallback>
                </Avatar>
                {
                  isUserViewingOwnProfile && (
                    <CameraIcon
                      className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-auto text-white opacity-0 group-hover:opacity-100 transition-all'
                    />
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
                    (isFetchingUserDetails || !RDBUSer) ?
                      <Skeleton className='h-6 my-1 w-48' /> :
                    (
                      <h1 className='text-xl text-brand-primary font-bold'>{ RDBUSer.fullName }</h1>
                    )
                  }
                  {(!isFetchingUserDetails && signedInUserFollowsThisUser) && (
                    <span className='text-xs bg-overlay text-brand-tertiary px-2 py-1 rounded-full'>
                      Follows you
                    </span>
                  )}
                </div>
                {
                  (isFetchingUserDetails || !RDBUSer) ?
                    <Skeleton className='h-3.5 my-0.5 w-24' /> :
                  (
                    <h4 className='text-sm text-brand-tertiary'>{ RDBUSer?.username }</h4>
                  )
                }
              </div>
              <div className='flex flex-row gap-2'>
                {
                  (!isAuthLoading && isSignedIn && user && UID) && (
                    <>
                      {
                        user.uid === UID ? (
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
                              variant={signedInUserFollowsThisUser ? 'outline' : 'default'}
                              className='h-8'
                              onClick={signedInUserFollowsThisUser ? _unfollowUser : _followUser}
                              disabled={
                                isFollowingOrUnfollowingUser ||
                                isAuthLoading ||
                                !isSignedIn ||
                                !user ||
                                !RDBUSer ||
                                !UID ||
                                UID === user.uid
                              }
                            >
                              {signedInUserFollowsThisUser ? 'Unfollow' : 'Follow'}
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
                                  disabled={isMutingOrUnmutingUser}
                                >
                                  { hasSignedInUserMutedUser ? 'Unmute' : 'Mute' }
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
              isFetchingUserDetails ? (
                <div className='flex flex-col gap-1.5 w-full'>
                  <Skeleton className='h-3.5 w-full' />
                  <Skeleton className='h-3.5 w-1/3' />
                </div>
              ) : (
                <div className='text-sm'>
                  {
                    (RDBUSer?.bio ?? '').trim().length > 0 ? (
                      <>
                        <pre className='whitespace-pre-wrap font-sans'>
                          {isBioExpanded ? RDBUSer?.bio : truncatedBio}
                          {shouldTruncateBio && !isBioExpanded && '...'}
                        </pre>
                        {shouldTruncateBio && (
                          <button
                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                            className='font-semibold text-brand-secondary hover:underline'
                          >
                            {isBioExpanded ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className='text-brand-tertiary italic select-none'>
                        {
                          isUserViewingOwnProfile ? (
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
                isFetchingUserDetails && 'pointer-events-none',
              )}
            >
              <FollowersDialog
                username={username ? username : undefined}
                UID={UID ? UID : undefined}
                disabled={isFetchingUserDetails || !UID}
              >
                <div className='flex items-center flex-row gap-1 text-sm group cursor-pointer'>
                  <span className='font-bold group-hover:underline'>
                    {
                      isFetchingUserDetails ?
                      <Skeleton className='w-6 h-4' /> :
                      (RDBUSer?.followerCount ?? 0)
                    }
                  </span>
                  <span className='font-normal group-hover:underline'>Followers</span>
                </div>
              </FollowersDialog>
              <FollowingDialog
                username={username ? username : undefined}
                UID={UID ? UID : undefined}
                disabled={isFetchingUserDetails || !UID}
              >
                <div className='flex items-center flex-row gap-1 text-sm group cursor-pointer'>
                  <span className='font-bold group-hover:underline'>
                    {
                      isFetchingUserDetails ?
                      <Skeleton className='w-6 h-4' /> :
                      (RDBUSer?.followingCount ?? 0)
                    }
                  </span>
                  <span className='font-normal group-hover:underline'>Following</span>
                </div>
              </FollowingDialog>
            </div>
            <div className='flex flex-row gap-4'>
              {
                URLs.map(URL => (
                  <div
                    className='text-sm text-blue font-regular hover:underline cursor-pointer flex flex-row gap-1'
                    onClick={() => handleOpenExternalURL(URL)}
                  >
                    <Link2Icon className='w-3.5 -mt-0.5 text-blue -rotate-[45deg]' strokeWidth={2} /> <p>{truncate(URL, { length: 20 })}</p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
        <Separator />
        <ScrollArea className='w-full h-[82%]' hideScrollbar>
          <div className='flex flex-col gap-4 w-full px-4 pt-7'>
            {/** TODO: Replace with user's comments and replies, mixed and sorted by time. */}
            {[...commentFixtures, ...commentFixtures]
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
                <Comment comment={comment} key={comment.id} />
              ))}
          </div>
        </ScrollArea>
      </main>
    </>
  )
}

// Exports:
export default Profile
