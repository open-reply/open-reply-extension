// Packages:
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import getPhotoURLFromUID from '../../utils/getPhotoURLFromUID'
import useAuth from '../../hooks/useAuth'
import { format, fromUnixTime } from 'date-fns'
import { isSignedInUserFollowing } from '../../firebase/firestore-database/users/get'
import { followUser, unfollowUser } from '../../firebase/firestore-database/users/set'
import { useToast } from '../ui/use-toast'
import pastellify from 'pastellify'

// Typescript:
import type { UID } from 'types/user'
import type { Topic } from 'types/comments-and-replies'

// Imports:
import {
  AudioWaveformIcon,
  CalendarDaysIcon,
  InfoIcon,
} from 'lucide-react'

// Constants:
import ROUTES from '../../routes'

// Components:
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import HighlightMentions from '../primary/HighlightMentions'
import TalksAboutTopics from './TalksAboutTopics'

// Functions:
const UserHoverCard = ({
  isFetchingUser,
  UID,
  fullName,
  username,
  bio,
  followingCount,
  followerCount,
  joinDate,
  talksAbout,
  children,
}: {
  isFetchingUser: boolean
  UID?: UID
  fullName?: string
  username?: string
  bio?: string
  followingCount?: number
  followerCount?: number
  joinDate?: number
  talksAbout?: Record<Topic, number>
  children: React.ReactNode
}) => {
  // Constants:
  const navigate = useNavigate()
  const {
    isLoading: isAuthLoading,
    isSignedIn,
    user,
  } = useAuth()
  const { toast } = useToast()
  const MAX_BIO_LINES = 2
  const MAX_BIO_CHARS = 80
  const shouldTruncateBio = (bio ?? '').split('\n').length > MAX_BIO_LINES || (bio ?? '').length > MAX_BIO_CHARS
  const truncatedBio = shouldTruncateBio
    ? (bio ?? '').split('\n').slice(0, MAX_BIO_LINES).join('\n').slice(0, MAX_BIO_CHARS)
    : (bio ?? '')

  // State:
  const [signedInUserFollowsThisUser, setSignedInUserFollowsThisUser] = useState<boolean | null>(null)
  const [isFollowingOrUnfollowingUser, setIsFollowingOrUnfollowingUser] = useState(false)
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [isUserViewingOwnProfile, setIsUserViewingOwnProfile] = useState(false)

  // Functions:
  const _followUser = async () => {
    try {
      if (
        isFollowingOrUnfollowingUser ||
        isAuthLoading ||
        !isSignedIn ||
        !user ||
        !fullName ||
        !UID ||
        UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await followUser(UID)
      if (!status) throw payload

      toast({
        title: `Followed @${ username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'UserHoverCard._followUser',
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
        !fullName ||
        !UID ||
        UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await unfollowUser(UID)
      if (!status) throw payload

      toast({
        title: `Unfollowed @${ username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'UserHoverCard._unfollowUser',
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
        functionName: 'UserHoverCard.checkIsSignedInUserFollowing',
        data: null,
        error,
      })
    }
  }

  // Effects:
  // Check if the signed-in user is following the author, and if they *are* the author.
  useEffect(() => {
    if (
      !isAuthLoading &&
      isSignedIn &&
      user &&
      UID
    ) {
      setIsUserViewingOwnProfile(user.uid === UID)
      if (user.uid !== UID) checkIsSignedInUserFollowing(UID)
    }
  }, [
    isAuthLoading,
    isSignedIn,
    user,
    UID,
  ])

  // Return:
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{ children }</HoverCardTrigger>
      <HoverCardContent className='w-72 text-brand-primary'>
        <div className='flex justify-between space-x-4'>
          <Avatar className='w-16 h-16'>
            <AvatarImage src={UID ? getPhotoURLFromUID(UID) : ''} alt={username} />
            <AvatarFallback
              className='text-2xl select-none'
              style={{ backgroundColor: UID ? pastellify(UID, { toCSS: true }) : 'inherit' }}
            >
              { fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }
            </AvatarFallback>
          </Avatar>
          {
            (!isAuthLoading && isSignedIn && user && !isFetchingUser) && (
              <>
                {
                  user.uid === UID ? (
                    <Button
                      variant='default'
                      className='h-9 mt-2'
                      onClick={editProfile}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      variant={signedInUserFollowsThisUser ? 'outline' : 'default'}
                      className='h-9 mt-2'
                      onClick={signedInUserFollowsThisUser ? _unfollowUser : _followUser}
                      disabled={
                        signedInUserFollowsThisUser ||
                        isAuthLoading ||
                        !isSignedIn ||
                        !user ||
                        UID === user.uid
                      }
                    >
                      {signedInUserFollowsThisUser ? 'Unfollow' : 'Follow'}
                    </Button>
                  )
                }
              </>
            )
          }
        </div>
        <div className='flex flex-col space-y-1 mt-3'>
          <div className='flex items-center justify-between'>
            {
              isFetchingUser ?
                <Skeleton className='h-3.5 w-24' /> :
              (
                <h4 className='font-semibold text-brand-primary cursor-pointer hover:underline'>
                  { fullName }
                </h4>
              )
            }
            {(!isFetchingUser && signedInUserFollowsThisUser) && (
              <span className='text-xs bg-overlay text-brand-tertiary px-2 py-1 rounded-full'>
                Follows you
              </span>
            )}
          </div>
          {
            isFetchingUser ?
            <Skeleton className='h-3.5 w-16' /> :
            <p className='text-sm text-brand-tertiary'>@{username}</p>
          }
        </div>
        {
          isFetchingUser ?
          (
            <div className='flex flex-col gap-1 mt-2'>
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-24' />
            </div>
          ) : (
            <div className='text-sm mt-2'>
              {
                (bio ?? '').trim().length > 0 ? (
                  <>
                    <pre className='whitespace-pre-wrap font-sans'>
                      {
                        shouldTruncateBio ?
                          isBioExpanded ? (
                            <HighlightMentions
                              text={bio ?? ''}
                              onMentionClick={mention => navigate(`/u/${mention}`)}
                            />
                          ) : truncatedBio : (
                            <HighlightMentions
                              text={bio ?? ''}
                              onMentionClick={mention => navigate(`/u/${mention}`)}
                            />
                          )
                      }
                      {shouldTruncateBio && !isBioExpanded && '...'}
                    </pre>
                    {shouldTruncateBio && (
                      <button
                        onClick={() => setIsBioExpanded(_isBioExpanded => !_isBioExpanded)}
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
        {
          (!isFetchingUser && talksAbout) && (
            <div className='flex gap-1 flex-wrap mt-2 text-xs font-medium text-brand-secondary'>
              <span className='flex justify-center items-center h-4 -mx-0.5'>
                <InfoIcon className='h-4 w-4 fill-brand-secondary text-white' />
                {/* <AudioWaveformIcon className='h-4 w-4' /> */}
              </span>
              <span>Talks</span>
              <span>about</span>
              <TalksAboutTopics topics={talksAbout} />
            </div>
          )
        }
        <div className='flex items-center pt-2 space-x-4'>
          <div className='flex items-center text-sm text-brand-tertiary'>
            <span className='font-semibold text-brand-primary mr-1'>
              {
                isFetchingUser ?
                <Skeleton className='w-6 h-3.5' /> :
                (followingCount ?? 0)
              }
            </span> Following
          </div>
          <div className='flex items-center text-sm text-brand-tertiary'>
            <span className='font-semibold text-brand-primary mr-1'>
              {
                isFetchingUser ?
                <Skeleton className='w-6 h-3.5' /> :
                (followerCount ?? 0)
              }
            </span> Followers
          </div>
        </div>
        {
          !isFetchingUser && (
            <div className='flex items-center pt-2'>
              <CalendarDaysIcon className='mr-2 h-4 w-4 opacity-70' />{' '}
              <span className='text-xs text-brand-tertiary'>
                Joined { joinDate ? format(fromUnixTime(joinDate / 1000), 'MMMM yyyy') : 'a long time ago..'}
              </span>
            </div>
          )
        }
      </HoverCardContent>
    </HoverCard>
  )
}

// Exports:
export default UserHoverCard
