// Packages:
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import getPhotoURLFromUID from '../../utils/getPhotoURLFromUID'
import useAuth from '../../hooks/useAuth'
import { truncate } from 'lodash'
import { format, fromUnixTime } from 'date-fns'
import { isSignedInUserFollowing } from '../../firebase/firestore-database/users/get'
import { followUser, unfollowUser } from '../../firebase/firestore-database/users/set'
import { useToast } from '../ui/use-toast'

// Typescript:
import type { UID } from 'types/user'

// Imports:
import { CalendarDaysIcon } from 'lucide-react'

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

  // State:
  const [signedInUserFollowsThisUser, setSignedInUserFollowsThisUser] = useState<boolean | null>(null)
  const [isFollowingOrUnfollowingUser, setIsFollowingOrUnfollowingUser] = useState(false)

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
        title: `Followed ${ fullName }!`,
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
        title: `Unfollowed ${ fullName }!`,
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
  // Check if the signed-in user is following the author.
  useEffect(() => {
    if (
      !isAuthLoading &&
      isSignedIn &&
      user &&
      UID
    ) checkIsSignedInUserFollowing(UID)
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
      <HoverCardContent className='w-80 text-brand-primary'>
        <div className='flex justify-between space-x-4'>
          <Avatar className='w-16 h-16'>
            <AvatarImage src={UID ? getPhotoURLFromUID(UID) : ''} alt={username} />
            <AvatarFallback>{ fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }</AvatarFallback>
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
            <p className='text-sm text-brand-tertiary'>{username}</p>
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
            <p className='text-sm mt-2'>{truncate(bio, { length: 40 })}</p>
          )
        }
        <div className='flex items-center pt-2 space-x-4'>
          <div className='flex items-center text-sm text-brand-tertiary'>
            <span className='font-semibold text-brand-primary mr-1'>
              {
                isFetchingUser ?
                <Skeleton className='w-6 h-3.5' /> :
                followingCount
              }
            </span> Following
          </div>
          <div className='flex items-center text-sm text-brand-tertiary'>
            <span className='font-semibold text-brand-primary mr-1'>
              {
                isFetchingUser ?
                <Skeleton className='w-6 h-3.5' /> :
                followerCount
              }
            </span> Followers
          </div>
        </div>
        {
          !isFetchingUser && (
            <div className='flex items-center pt-2'>
              <CalendarDaysIcon className='mr-2 h-4 w-4 opacity-70' />{' '}
              <span className='text-xs text-brand-tertiary'>
                Joined { joinDate ? format(fromUnixTime(joinDate), 'MMMM yyyy') : 'a long time ago..'}
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
