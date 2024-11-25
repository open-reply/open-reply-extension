// Packages:
import React, { useState, useEffect } from 'react'
import useAuth from '../../hooks/useAuth'
import { useToast } from '../ui/use-toast'
import { getFollowers } from '../../firebase/firestore-database/users/get'
import pastellify from 'pastellify'
import { getRDBUser } from '../../firebase/realtime-database/users/get'
import getPhotoURLFromUID from '../../utils/getPhotoURLFromUID'
import { followUser, unfollowUser } from '../../firebase/firestore-database/users/set'
import { useNavigate } from 'react-router-dom'

// Typescript:
import type { UID } from 'types/user'
import type { RealtimeDatabaseUser } from 'types/realtime.database'

// Imports:
import { PlusIcon } from 'lucide-react'
import LoadingIcon from '../primary/LoadingIcon'

// Components:
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'

// Functions:
const FollowerListItem = ({
  follower
}: {
  follower: RealtimeDatabaseUser & { UID: UID }
}) => {
  // Constants:
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    isLoading: isAuthLoading,
    isSignedIn,
    user,
  } = useAuth()

  // State:
  const [signedInUserFollowsThisUser, setSignedInUserFollowsThisUser] = useState(false)
  const [isFollowingOrUnfollowingUser, setIsFollowingOrUnfollowingUser] = useState(false)

  // Functions:
  const _followUser = async () => {
    try {
      if (
        isFollowingOrUnfollowingUser ||
        isAuthLoading ||
        !isSignedIn ||
        !user ||
        follower.UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await followUser(follower.UID)
      if (!status) throw payload

      setSignedInUserFollowsThisUser(true)
      toast({
        title: `Followed @${ follower.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'FollowerListItem._followUser',
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
        follower.UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await unfollowUser(follower.UID)
      if (!status) throw payload

      setSignedInUserFollowsThisUser(false)
      toast({
        title: `Unfollowed @${ follower.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'FollowerListItem._unfollowUser',
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

  // Return:
  return (
    <div className='flex items-center space-x-3'>
      <Avatar
        className='w-12 h-12'
        onClick={() => navigate(`/u/${ follower.username }`)}
      >
        <AvatarImage src={getPhotoURLFromUID(follower.UID)} alt={follower.username} />
        <AvatarFallback
          className='text-lg select-none'
          style={
            follower.UID ? {
              backgroundColor: pastellify(follower.UID, { toCSS: true })
            } : {}
          }
        >
          { follower.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }
        </AvatarFallback>
      </Avatar>
      <div
        className='flex flex-col gap-1'
        onClick={() => navigate(`/u/${ follower.username }`)}
      >
        <p className='text-sm font-medium leading-none'>{follower.fullName}</p>
        <p className='text-sm text-brand-secondary'>@{follower.username}</p>
      </div>
      {
        (
          !isAuthLoading &&
          isSignedIn &&
          user &&
          follower.UID !== user.uid
        ) && (
          <Button
            variant={signedInUserFollowsThisUser ? 'outline' : 'default'}
            size='sm'
            onClick={signedInUserFollowsThisUser ? _unfollowUser : _followUser}
            disabled={isFollowingOrUnfollowingUser}
          >
            { signedInUserFollowsThisUser ? 'Unfollow' : 'Follow' }
          </Button>
        )
      }
    </div>
  )
}

const FollowersDialog = ({
  username,
  UID,
  disabled,
  children,
}: {
  username?: string
  UID?: UID
  disabled?: boolean
  children: React.ReactNode
}) => {
  // Constants:
  const { toast } = useToast()

  // State:
  const [isOpen, setIsOpen] = useState(false)
  const [isFetchingFollowers, setIsFetchingFollowers] = useState(true)
  const [isFetchingMoreFollowers, setIsFetchingMoreFollowers] = useState(false)
  const [followers, setFollowers] = useState<(RealtimeDatabaseUser & { UID: UID })[]>([])
  const [lastVisible, setLastVisible] = useState<UID | null>(null)
  const [areAllFollowersFetched, setAreAllFollowersFetched] = useState(false)
  
  // Functions:
  const fetchFollowers = async (UID: UID) => {
    try {
      if (
        isFetchingFollowers ||
        isFetchingMoreFollowers ||
        areAllFollowersFetched
      ) return

      setIsFetchingFollowers(true)
      const {
        status: getFollowersStatus,
        payload: getFollowersPayload,
      } = await getFollowers({
        lastVisible: null,
        UID,
      })
      if (!getFollowersStatus) throw getFollowersPayload

      const {
        followers: partialFollowers,
        lastVisible: _lastVisible,
      } = getFollowersPayload
      
      const newFollowers: (RealtimeDatabaseUser & { UID: UID })[] = []
      if (partialFollowers.length > 0) {

        for await (const partialFollower of partialFollowers) {
          const {
            status: getRDBUserStatus,
            payload: getRDBUserPayload,
          } = await getRDBUser({ UID: partialFollower.UID })
          if (!getRDBUserStatus) throw getRDBUserPayload
          if (getRDBUserPayload) newFollowers.push({
            ...getRDBUserPayload,
            UID: partialFollower.UID,
          })
        }
      } else setAreAllFollowersFetched(true)

      setFollowers(_followers => [..._followers, ...newFollowers])
      setLastVisible(_lastVisible)
    } catch (error) {
      logError({
        functionName: 'FollowersDialog.fetchFollowers',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingFollowers(false)
    }
  }

  const fetchMoreFollowers = async () => {
    try {
      if (
        isFetchingFollowers ||
        isFetchingMoreFollowers ||
        areAllFollowersFetched ||
        !UID
      ) return

      setIsFetchingMoreFollowers(true)
      
      const {
        status: getFollowersStatus,
        payload: getFollowersPayload,
      } = await getFollowers({
        lastVisible,
        UID,
      })
      if (!getFollowersStatus) throw getFollowersPayload

      const {
        followers: partialFollowers,
        lastVisible: _lastVisible,
      } = getFollowersPayload
      
      const newFollowers: (RealtimeDatabaseUser & { UID: UID })[] = []
      if (partialFollowers.length > 0) {

        for await (const partialFollower of partialFollowers) {
          const {
            status: getRDBUserStatus,
            payload: getRDBUserPayload,
          } = await getRDBUser({ UID: partialFollower.UID })
          if (!getRDBUserStatus) throw getRDBUserPayload
          if (getRDBUserPayload) newFollowers.push({
            ...getRDBUserPayload,
            UID: partialFollower.UID,
          })
        }
      } else setAreAllFollowersFetched(true)

      setFollowers(_followers => [..._followers, ...newFollowers])
      setLastVisible(_lastVisible)
    } catch (error) {
      logError({
        functionName: 'FollowersDialog.fetchMoreFollowing',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingMoreFollowers(false)
    }
  }

  // Effects:
  useEffect(() => {
    if (UID && isOpen) fetchFollowers(UID)
  }, [UID, isOpen])

  // Return:
  return (
    <Dialog onOpenChange={open => setIsOpen(open)}>
      <DialogTrigger disabled={disabled} asChild>{ children }</DialogTrigger>
      <DialogContent className='w-96 text-brand-primary p-4 pb-0'>
        <DialogHeader>
          <DialogTitle>@{username}'s Followers</DialogTitle>
        </DialogHeader>
        {
          (isFetchingFollowers || followers.length === 0) ? (
            <div className='flex justify-center items-center w-full h-[300px]'>
              {
                isFetchingFollowers ? (
                  <div className='flex flex-row gap-1 font-medium'>
                    <LoadingIcon className='w-4 h-4 text-brand-primary' aria-hidden='true' />
                    <p className='text-xs text-brand-secondary'>Loading...</p>
                  </div>
                ) : (
                  <div className='text-xs font-medium'>No followers found :(</div>
                )
              }
            </div>
          ) : (
            <ScrollArea className='w-full h-96 mt-4' hideScrollbar>
              <div className='flex flex-col gap-4 w-full'>
                {followers.map(follower => (
                  <FollowerListItem
                    key={follower.UID}
                    follower={follower}
                  />
                ))}
                {
                  areAllFollowersFetched ? (
                    <div className='w-full h-8' />
                  ) : (
                    <>
                      {
                        isFetchingMoreFollowers ? (
                          <div className='flex justify-center items-center flex-row gap-1 w-full h-8 pb-5 font-medium select-none'>
                            <LoadingIcon className='w-4 h-4 text-brand-primary' aria-hidden='true' />
                            <p className='text-xs text-brand-secondary'>Loading...</p>
                          </div>
                        ) : (
                          <div
                            className='flex justify-center items-center flex-row gap-1 w-full h-8 pb-5 font-medium cursor-pointer select-none'
                            onClick={fetchMoreFollowers}
                          >
                            <PlusIcon className='w-3 h-3 text-brand-primary' aria-hidden='true' />
                            <p className='text-xs text-brand-secondary'>Load More</p>
                          </div>
                        )
                      }
                    </>
                  )
                }
              </div>
            </ScrollArea>
          )
        }
      </DialogContent>
    </Dialog>
  )
}

// Exports:
export default FollowersDialog
