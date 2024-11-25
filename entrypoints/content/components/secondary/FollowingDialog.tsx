// Packages:
import React, { useState, useEffect } from 'react'
import useAuth from '../../hooks/useAuth'
import { useToast } from '../ui/use-toast'
import { getFollowing } from '../../firebase/firestore-database/users/get'
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
const FollowingUserListItem = ({
  followingUser
}: {
  followingUser: RealtimeDatabaseUser & { UID: UID }
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
        followingUser.UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await followUser(followingUser.UID)
      if (!status) throw payload

      setSignedInUserFollowsThisUser(true)
      toast({
        title: `Followed @${ followingUser.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'FollowingUserListItem._followUser',
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
        followingUser.UID === user.uid
      ) return

      setIsFollowingOrUnfollowingUser(true)
      const {
        status,
        payload,
      } = await unfollowUser(followingUser.UID)
      if (!status) throw payload

      setSignedInUserFollowsThisUser(false)
      toast({
        title: `Unfollowed @${ followingUser.username }!`,
      })
    } catch (error) {
      logError({
        functionName: 'FollowingUserListItem._unfollowUser',
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
        onClick={() => navigate(`/u/${ followingUser.username }`)}
      >
        <AvatarImage src={getPhotoURLFromUID(followingUser.UID)} alt={followingUser.username} />
        <AvatarFallback
          className='text-lg select-none'
          style={
            followingUser.UID ? {
              backgroundColor: pastellify(followingUser.UID, { toCSS: true })
            } : {}
          }
        >
          { followingUser.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }
        </AvatarFallback>
      </Avatar>
      <div
        className='flex flex-col gap-1'
        onClick={() => navigate(`/u/${ followingUser.username }`)}
      >
        <p className='text-sm font-medium leading-none'>{followingUser.fullName}</p>
        <p className='text-sm text-brand-secondary'>@{followingUser.username}</p>
      </div>
      {
        (
          !isAuthLoading &&
          isSignedIn &&
          user &&
          followingUser.UID !== user.uid
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

const FollowingDialog = ({
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
  const [isFetchingFollowing, setIsFetchingFollowing] = useState(true)
  const [isFetchingMoreFollowing, setIsFetchingMoreFollowing] = useState(false)
  const [following, setFollowing] = useState<(RealtimeDatabaseUser & { UID: UID })[]>([])
  const [lastVisible, setLastVisible] = useState<UID | null>(null)
  const [areAllFollowingFetched, setAreAllFollowingFetched] = useState(false)
  
  // Functions:
  const fetchFollowing = async (UID: UID) => {
    try {
      if (
        isFetchingFollowing ||
        isFetchingMoreFollowing ||
        areAllFollowingFetched
      ) return

      setIsFetchingFollowing(true)
      const {
        status: getFollowingStatus,
        payload: getFollowingPayload,
      } = await getFollowing({
        lastVisible: null,
        UID,
      })
      if (!getFollowingStatus) throw getFollowingPayload

      const {
        following: partialFollowing,
        lastVisible: _lastVisible,
      } = getFollowingPayload
      
      const newFollowing: (RealtimeDatabaseUser & { UID: UID })[] = []
      if (partialFollowing.length > 0) {

        for await (const partialFollowingUser of partialFollowing) {
          const {
            status: getRDBUserStatus,
            payload: getRDBUserPayload,
          } = await getRDBUser({ UID: partialFollowingUser.UID })
          if (!getRDBUserStatus) throw getRDBUserPayload
          if (getRDBUserPayload) newFollowing.push({
            ...getRDBUserPayload,
            UID: partialFollowingUser.UID,
          })
        }
      } else setAreAllFollowingFetched(true)

      setFollowing(_following => [..._following, ...newFollowing])
      setLastVisible(_lastVisible)
    } catch (error) {
      logError({
        functionName: 'FollowingDialog.fetchFollowing',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingFollowing(false)
    }
  }

  const fetchMoreFollowing = async () => {
    try {
      if (
        isFetchingFollowing ||
        isFetchingMoreFollowing ||
        areAllFollowingFetched ||
        !UID
      ) return

      setIsFetchingMoreFollowing(true)
      
      const {
        status: getFollowingStatus,
        payload: getFollowingPayload,
      } = await getFollowing({
        lastVisible,
        UID,
      })
      if (!getFollowingStatus) throw getFollowingPayload

      const {
        following: partialFollowing,
        lastVisible: _lastVisible,
      } = getFollowingPayload
      
      const newFollowing: (RealtimeDatabaseUser & { UID: UID })[] = []
      if (partialFollowing.length > 0) {

        for await (const partialFollowingUser of partialFollowing) {
          const {
            status: getRDBUserStatus,
            payload: getRDBUserPayload,
          } = await getRDBUser({ UID: partialFollowingUser.UID })
          if (!getRDBUserStatus) throw getRDBUserPayload
          if (getRDBUserPayload) newFollowing.push({
            ...getRDBUserPayload,
            UID: partialFollowingUser.UID,
          })
        }
      } else setAreAllFollowingFetched(true)

      setFollowing(_following => [..._following, ...newFollowing])
      setLastVisible(_lastVisible)
    } catch (error) {
      logError({
        functionName: 'FollowingDialog.fetchMoreFollowing',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingMoreFollowing(false)
    }
  }

  // Effects:
  useEffect(() => {
    if (UID && isOpen) fetchFollowing(UID)
  }, [UID, isOpen])

  // Return:
  return (
    <Dialog onOpenChange={open => setIsOpen(open)}>
      <DialogTrigger disabled={disabled} asChild>{ children }</DialogTrigger>
      <DialogContent className='w-96 text-brand-primary p-4 pb-0'>
        <DialogHeader>
          <DialogTitle>@{username}'s Following</DialogTitle>
        </DialogHeader>
        {
          (isFetchingFollowing || following.length === 0) ? (
            <div className='flex justify-center items-center w-full h-[300px]'>
              {
                isFetchingFollowing ? (
                  <div className='flex flex-row gap-1 font-medium'>
                    <LoadingIcon className='w-4 h-4 text-brand-primary' aria-hidden='true' />
                    <p className='text-xs text-brand-secondary'>Loading...</p>
                  </div>
                ) : (
                  <div className='text-xs font-medium'>No following found :(</div>
                )
              }
            </div>
          ) : (
            <ScrollArea className='w-full h-96 mt-4' hideScrollbar>
              <div className='flex flex-col gap-4 w-full'>
                {following.map(followingUser => (
                  <FollowingUserListItem
                    key={followingUser.UID}
                    followingUser={followingUser}
                  />
                ))}
                {
                  areAllFollowingFetched ? (
                    <div className='w-full h-8' />
                  ) : (
                    <>
                      {
                        isFetchingMoreFollowing ? (
                          <div className='flex justify-center items-center flex-row gap-1 w-full h-8 pb-5 font-medium select-none'>
                            <LoadingIcon className='w-4 h-4 text-brand-primary' aria-hidden='true' />
                            <p className='text-xs text-brand-secondary'>Loading...</p>
                          </div>
                        ) : (
                          <div
                            className='flex justify-center items-center flex-row gap-1 w-full h-8 pb-5 font-medium cursor-pointer select-none'
                            onClick={fetchMoreFollowing}
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
export default FollowingDialog
