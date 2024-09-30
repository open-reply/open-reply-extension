// Packages:
import { useState, useEffect } from 'react'
import { cn } from '@/entrypoints/content/lib/utils'
import { getRDBUser } from '@/entrypoints/content/firebase/realtime-database/users/get'
import getPhotoURLFromUID from '@/entrypoints/content/utils/getPhotoURLFromUID'
import prettyMilliseconds from 'pretty-ms'
import { format, fromUnixTime } from 'date-fns'
import { useToast } from '../../ui/use-toast'
import useAuth from '@/entrypoints/content/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  followUser,
  unfollowUser,
} from '@/entrypoints/content/firebase/firestore-database/users/set'
import { isEmpty } from 'lodash'
import { isSignedInUserFollowing } from '@/entrypoints/content/firebase/firestore-database/users/get'

// Typescript:
import type {
  ReplyID,
  Reply as ReplyInterface,
} from 'types/comments-and-replies'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { Timestamp } from 'firebase/firestore'
import type { UID } from 'types/user'

// Imports:
import { CalendarDaysIcon, CircleHelpIcon } from 'lucide-react'

// Constants:
import { SECOND } from 'time-constants'
import ROUTES from '@/entrypoints/content/routes'

// Components:
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../ui/avatar'
import ReplyAction from './ReplyAction'
import { Textarea } from '../../ui/textarea'
import { Button } from '../../ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../../ui/hover-card'
import { Separator } from '../../ui/separator'
import { Skeleton } from '../../ui/skeleton'

// Functions:
const Reply = ({ reply }: { reply: ReplyInterface }) => {
  // Constants:
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    isLoading,
    isSignedIn,
    user,
  } = useAuth()
  const MAX_LINES = 3
  const MAX_CHARS = 150
  const shouldTruncate = reply.body.split('\n').length > MAX_LINES || reply.body.length > MAX_CHARS
  const truncatedText = shouldTruncate
    ? reply.body.split('\n').slice(0, MAX_LINES).join('\n').slice(0, MAX_CHARS)
    : reply.body
  const ageOfReply = reply.createdAt instanceof Timestamp ?
    ((reply.createdAt as Timestamp).toDate().getMilliseconds() - Date.now()) > 30 * SECOND ?
      prettyMilliseconds((reply.createdAt as Timestamp).toDate().getMilliseconds() - Date.now(), { compact: true }) :
      'now' :
    'now'

  // State:
  const [isFetchingAuthor, setIsFetchingAuthor] = useState(false)
  const [author, setAuthor] = useState<RealtimeDatabaseUser | null>(null)
  const [userFollowsAuthor, setUserFollowsAuthor] = useState(false)
  const [isFollowingOrUnfollowingAuthor, setIsFollowingOrUnfollowingAuthor] = useState(false)
  const [isReplyTextAreaEnabled, setIsReplyTextAreaEnabled] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isReplyingToReply, setIsReplyingToReply] = useState<null | ReplyID>(null)
  const [isThereIssueWithReply, setIsThereIssueWithReply] = useState(false)
  const [issueWithReplyText, setIssueWithReplyText] = useState<string | null>(null)
  const [fixReplySuggestion, setFixReplySuggestion] = useState<string | null>(null)
  const [isAddingReply, setIsAddingReply] = useState(false)
  const [showCancelReplyAlertDialog, setShowCancelReplyAlertDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Functions:
  const fetchAuthor = async (UID: UID) => {
    try {
      setIsFetchingAuthor(true)
      const { status, payload } = await getRDBUser({ UID })
      if (!status) throw payload
      if (!isEmpty(payload) && !!payload) {
        setAuthor(payload)
        setIsFetchingAuthor(false)
      }
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 reply, resulting in too many error toasts.
      logError({
        functionName: 'Reply.fetchAuthor',
        data: null,
        error,
      })
    }
  }
  
  const discardReply = () => {
    setIsReplyTextAreaEnabled(false)
    setReplyText('')
    setIsReplyingToReply(null)
    setIsThereIssueWithReply(false)
    setIssueWithReplyText(null)
    setFixReplySuggestion(null)
    setShowCancelReplyAlertDialog(false)
  }

  const followAuthor = async () => {
    try {
      setIsFollowingOrUnfollowingAuthor(true)
      const {
        status,
        payload,
      } = await followUser(reply.author)
      if (!status) throw payload

      toast({
        title: `Followed ${ author?.fullName }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Reply.followAuthor',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFollowingOrUnfollowingAuthor(false)
    }
  }

  const unfollowAuthor = async () => {
    try {
      setIsFollowingOrUnfollowingAuthor(true)
      const {
        status,
        payload,
      } = await unfollowUser(reply.author)
      if (!status) throw payload

      toast({
        title: `Unfollowed ${ author?.fullName }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Reply.unfollowAuthor',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFollowingOrUnfollowingAuthor(false)
    }
  }

  const editProfile = () => {
    navigate(ROUTES.SETTINGS, { state: { tabIndex: 0 } })
  }

  const checkIsSignedInUserFollowing = async (authorUID: UID) => {
    try {
      const {
        status,
        payload,
      } = await isSignedInUserFollowing(authorUID)
      if (!status) throw payload
      setUserFollowsAuthor(payload)
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 reply, resulting in too many error toasts.
      logError({
        functionName: 'Reply.checkIsSignedInUserFollowing',
        data: null,
        error,
      })
    }
  }

  // Effects:
  // Fetches the author's details.
  useEffect(() => {
    fetchAuthor(reply.author)
  }, [reply])

  // Check if the signed-in user is following the author.
  useEffect(() => {
    if (
      !isLoading &&
      isSignedIn &&
      user
    ) checkIsSignedInUserFollowing(reply.author)
  }, [
    isLoading,
    isSignedIn,
    user,
    reply,
  ])

  // Return:
  return (
    <>
      <AlertDialog open={showCancelReplyAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard reply?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to discard your reply? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelReplyAlertDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={discardReply}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className='flex flex-row space-x-4'>
        <div className='relative flex-none'>
          <div className='absolute top-0 left-[calc(-1.375rem-0.5px)] w-[calc(1.375rem+0.5px)] h-5 border-b-[1px] border-b-border-secondary border-l-[1px] border-l-border-secondary rounded-bl-xl' />
          <Avatar>
            <AvatarImage src={getPhotoURLFromUID(reply.author)} alt={author?.username} />
            <AvatarFallback>{ author?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }</AvatarFallback>
          </Avatar>
        </div>  
        <div className='flex-initial'>
          <div className='flex flex-col space-y-1 text-sm'>
            <div className='flex items-center space-x-1.5 text-brand-tertiary'>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <h1 className='font-semibold text-brand-primary cursor-pointer hover:underline'>
                    {
                      isFetchingAuthor ?
                      <Skeleton className='h-4 w-28' /> : author?.fullName
                    }
                  </h1>
                </HoverCardTrigger>
                <HoverCardContent className='w-80 text-brand-primary'>
                  <div className='flex justify-between space-x-4'>
                    <Avatar className='w-16 h-16'>
                      <AvatarImage src={getPhotoURLFromUID(reply.author)} alt={author?.username} />
                      <AvatarFallback>{ author?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }</AvatarFallback>
                    </Avatar>
                    {
                      (!isLoading && isSignedIn && user && !isFetchingAuthor) && (
                        <>
                          {
                            user.uid === reply.author ? (
                              <Button
                                variant='default'
                                className='h-9 mt-2'
                                onClick={editProfile}
                              >
                                Edit Profile
                              </Button>
                            ) : (
                              <Button
                                variant={userFollowsAuthor ? 'outline' : 'default'}
                                className='h-9 mt-2'
                                onClick={userFollowsAuthor ? unfollowAuthor : followAuthor}
                                disabled={isFollowingOrUnfollowingAuthor}
                              >
                                {userFollowsAuthor ? 'Unfollow' : 'Follow'}
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
                        isFetchingAuthor ?
                          <Skeleton className='h-3.5 w-24' /> :
                        (
                          <h4 className='font-semibold text-brand-primary cursor-pointer hover:underline'>
                            { author?.fullName }
                          </h4>
                        )
                      }
                      {(!isFetchingAuthor && userFollowsAuthor) && (
                        <span className='text-xs bg-overlay text-brand-tertiary px-2 py-1 rounded-full'>
                          Follows you
                        </span>
                      )}
                    </div>
                    {
                      isFetchingAuthor ?
                      <Skeleton className='h-3.5 w-16' /> :
                      <p className='text-sm text-brand-tertiary'>{author?.username}</p>
                    }
                  </div>
                  {
                    isFetchingAuthor ?
                    (
                      <div className='flex flex-col gap-1 mt-2'>
                        <Skeleton className='h-3 w-full' />
                        <Skeleton className='h-3 w-full' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    ) : (
                      <p className='text-sm mt-2'>{author?.bio}</p>
                    )
                  }
                  <div className='flex items-center pt-2 space-x-4'>
                    <div className='flex items-center text-sm text-brand-tertiary'>
                      <span className='font-semibold text-brand-primary mr-1'>
                        {
                          isFetchingAuthor ?
                          <Skeleton className='w-6 h-3.5' /> :
                          author?.followingCount
                        }
                      </span> Following
                    </div>
                    <div className='flex items-center text-sm text-brand-tertiary'>
                      <span className='font-semibold text-brand-primary mr-1'>
                        {
                          isFetchingAuthor ?
                          <Skeleton className='w-6 h-3.5' /> :
                          author?.followerCount
                        }
                      </span> Followers
                    </div>
                  </div>
                  {
                    !isFetchingAuthor && (
                      <div className='flex items-center pt-2'>
                        <CalendarDaysIcon className='mr-2 h-4 w-4 opacity-70' />{' '}
                        <span className='text-xs text-brand-tertiary'>
                          Joined { author?.joinDate ? format(fromUnixTime(author?.joinDate), 'MMMM yyyy') : 'a long time ago..'}
                        </span>
                      </div>
                    )
                  }
                </HoverCardContent>
              </HoverCard>
              {
                isFetchingAuthor ?
                <Skeleton className='h-4 w-16' /> :
                <p className='cursor-pointer'>{author?.username}</p>
              }
              <p className='self-center'>·</p>
              <p className='cursor-pointer hover:underline'>{ageOfReply}</p>
            </div>
            <div className='text-sm'>
              <pre className='whitespace-pre-wrap font-sans'>
                {isExpanded ? reply.body : truncatedText}
                {shouldTruncate && !isExpanded && '...'}
              </pre>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className='font-semibold text-brand-secondary hover:underline'
                >
                  {isExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
            <ReplyAction
              reply={reply}
              fetchReply={async () => {}}
              toggleReplyToReply={
                isReplyTextAreaEnabled ?
                () => {
                  if (replyText.trim().length === 0) discardReply()
                  else setShowCancelReplyAlertDialog(true)
                } : () => setIsReplyTextAreaEnabled(true)
              }
            />
            {
              isReplyTextAreaEnabled && (
                <div className='flex flex-col gap-2.5 w-full'>
                  <Textarea
                    className={cn(
                      'h-16 resize-none',
                      isThereIssueWithReply && 'border-2 border-rose-600'
                    )}
                    placeholder='Share your thoughts'
                    value={replyText}
                    onChange={event => {
                      setReplyText(event.target.value)
                    }}
                  />
                  <div className='flex justify-between items-start w-full'>
                    <div className='flex items-center gap-[3px] font-medium text-sm text-rose-600'>
                      {
                        issueWithReplyText?.split(' ').map((word, index) => <span key={`issue-word-${ index }`}>{word}</span>)
                      }
                      {
                        isThereIssueWithReply && (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <CircleHelpIcon
                                width={16}
                                height={16}
                                strokeWidth={2}
                                className='ml-1 cursor-pointer'
                              />
                            </HoverCardTrigger>
                            <HoverCardContent className='flex flex-col gap-2'>
                              <div className='font-bold text-lg'>Suggestions</div>
                              <Separator className='mb-1' />
                              <div>{ fixReplySuggestion }</div>
                            </HoverCardContent>
                          </HoverCard>
                        )
                      }
                    </div>
                    <div className='flex justify-center items-center gap-2.5'>
                      <Button
                        size='sm'
                        className='h-8 px-4 py-2 transition-all'
                        variant='outline'
                        onClick={() => {
                          if (replyText.trim().length === 0) discardReply()
                          else setShowCancelReplyAlertDialog(true)
                        }}
                        disabled={isAddingReply}
                      >
                        Cancel
                      </Button>
                      {
                        isThereIssueWithReply ? (
                          <Button
                            size='sm'
                            className='h-8 px-4 py-2 transition-all'
                            variant='destructive'
                            // onClick={() => _addReply({ bypassOwnReplyCheck: true })}
                            disabled={isAddingReply || replyText.trim().length === 0}
                          >
                            Reply Anyway
                          </Button>
                        ) : (
                          <Button
                            size='sm'
                            className='h-8 px-4 py-2 transition-all'
                            variant='default'
                            // onClick={() => _addReply()}
                            disabled={isAddingReply || replyText.trim().length === 0}
                          >
                            Reply
                          </Button>
                        )
                      }
                    </div>
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </>
  )
}

// Exports:
export default Reply
