// Packages:
import { useRef, useState, useEffect } from 'react'
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
import millify from 'millify'
import simplur from 'simplur'
import { getReplies } from '@/entrypoints/content/firebase/firestore-database/reply/get'
import useUserPreferences from '@/entrypoints/content/hooks/useUserPreferences'
import { checkCommentForHateSpeech } from '../../../firebase/firestore-database/comment/get'

// Typescript:
import type {
  Comment as CommentInterface,
  Reply as ReplyInterface,
} from 'types/comments-and-replies'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { UID } from 'types/user'
import { UnsafeContentPolicy } from 'types/user-preferences'

// Imports:
import {
  CalendarDaysIcon,
  CircleHelpIcon,
  CircleIcon,
  CirclePlusIcon,
} from 'lucide-react'

// Constants:
import { SECOND } from 'time-constants'
import ROUTES from '@/entrypoints/content/routes'
import { replyFixtures } from '@/fixtures/reply'

// Components:
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../ui/avatar'
import CommentAction from './CommentAction'
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
import Reply from '../reply/Reply'
import LoadingIcon from '../../primary/LoadingIcon'
import { addReply } from '@/entrypoints/content/firebase/firestore-database/reply/set'

// Functions:
const Comment = ({ comment }: { comment: CommentInterface }) => {
  // Constants:
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    isLoading,
    isSignedIn,
    user,
  } = useAuth()
  const { moderation } = useUserPreferences()
  const MAX_LINES = 3
  const MAX_CHARS = 150
  const shouldTruncate = comment.body.split('\n').length > MAX_LINES || comment.body.length > MAX_CHARS
  const truncatedText = shouldTruncate
    ? comment.body.split('\n').slice(0, MAX_LINES).join('\n').slice(0, MAX_CHARS)
    : comment.body
  const ageOfComment = comment.createdAt instanceof Timestamp ?
    ((comment.createdAt as Timestamp).toDate().getMilliseconds() - Date.now()) > 30 * SECOND ?
      prettyMilliseconds((comment.createdAt as Timestamp).toDate().getMilliseconds() - Date.now(), { compact: true }) :
      'now' :
    'now'

  // Ref:
  const reviewedReplyTextsSetRef = useRef<Map<string, string>>(new Map())

  // State:
  const [isFetchingAuthor, setIsFetchingAuthor] = useState(false)
  const [author, setAuthor] = useState<RealtimeDatabaseUser | null>(null)
  const [userFollowsAuthor, setUserFollowsAuthor] = useState(false)
  const [isFollowingOrUnfollowingAuthor, setIsFollowingOrUnfollowingAuthor] = useState(false)
  const [isReplyTextAreaEnabled, setIsReplyTextAreaEnabled] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isThereIssueWithReply, setIsThereIssueWithReply] = useState(false)
  const [issueWithReplyText, setIssueWithReplyText] = useState<string | null>(null)
  const [fixReplySuggestion, setFixReplySuggestion] = useState<string | null>(null)
  const [isAddingReply, setIsAddingReply] = useState(false)
  const [showCancelReplyAlertDialog, setShowCancelReplyAlertDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isShowingReplies, setIsShowingReplies] = useState(false)
  const [isFetchingReplies, setIsFetchingReplies] = useState(false)
  const [isLoadingMoreReplies, setIsLoadingMoreReplies] = useState(false)
  const [replies, setReplies] = useState<ReplyInterface[]>([])
  const [lastVisibleReplyForPagination, setLastVisibleReplyForPagination] = useState<QueryDocumentSnapshot<ReplyInterface, DocumentData> | null>(null)
  const [areThereNoMoreRepliesToLoad, setAreThereNoMoreRepliesToLoad] = useState(false)

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
      // NOTE: We're not showing an error toast here, since there'd be more than 1 comment, resulting in too many error toasts.
      logError({
        functionName: 'Comment.fetchAuthor',
        data: null,
        error,
      })
    }
  }
  
  const discardReply = () => {
    setIsReplyTextAreaEnabled(false)
    setReplyText('')
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
      } = await followUser(comment.author)
      if (!status) throw payload

      toast({
        title: `Followed ${ author?.fullName }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Comment.followAuthor',
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
      } = await unfollowUser(comment.author)
      if (!status) throw payload

      toast({
        title: `Unfollowed ${ author?.fullName }!`,
      })
    } catch (error) {
      logError({
        functionName: 'Comment.unfollowAuthor',
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
      // NOTE: We're not showing an error toast here, since there'd be more than 1 comment, resulting in too many error toasts.
      logError({
        functionName: 'Comment.checkIsSignedInUserFollowing',
        data: null,
        error,
      })
    }
  }

  const showReplies = async () => {
    try {
      if (isFetchingReplies) return
      if (comment.replyCount <= replies.length) {
        setIsShowingReplies(true)
        return
      }
      setIsFetchingReplies(true)
      setIsShowingReplies(true)

      const {
        status,
        payload,
      } = await getReplies({
        URLHash: comment.URLHash,
        commentID: comment.id,
        lastVisible: null,
        limit: 10,
      })
      if (!status) throw payload

      const { lastVisible, replies: fetchedReplies } = payload

      // setReplies(_replies => [..._replies, ...fetchedReplies])
      setReplies(_replies => [..._replies, ...fetchedReplies, ...replyFixtures])
      setLastVisibleReplyForPagination(lastVisible)
    } catch (error) {
      logError({
        functionName: 'Comment.showReplies',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingReplies(false)
    }
  }

  const loadMoreReplies = async () => {
    try {
      if (isLoadingMoreReplies) return
      if (comment.replyCount <= replies.length) {
        setAreThereNoMoreRepliesToLoad(true)
        return
      }
      setIsLoadingMoreReplies(true)

      const {
        status,
        payload,
      } = await getReplies({
        URLHash: comment.URLHash,
        commentID: comment.id,
        lastVisible: lastVisibleReplyForPagination,
        limit: 10,
      })
      if (!status) throw payload

      const { lastVisible, replies: fetchedReplies } = payload

      if (fetchedReplies.length === 0) {
        setAreThereNoMoreRepliesToLoad(true)
      } else {
        setReplies(_replies => [..._replies, ...fetchedReplies])
        setLastVisibleReplyForPagination(lastVisible)
      }
    } catch (error) {
      logError({
        functionName: 'Comment.loadMoreReplies',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsLoadingMoreReplies(false)
    }
  }

  const checkOwnReplyForOffensiveSpeech = async (replyText: string): Promise<boolean> => {
    const DEFAULT_REPLY_TEXT_ISSUE = 'Offensive language detected. Please consider rephrasing the offensive language.'
    try {
      setIsThereIssueWithReply(false)
      setIssueWithReplyText(null)
      setFixReplySuggestion(null)

      if (
        reviewedReplyTextsSetRef.current &&
        reviewedReplyTextsSetRef.current.has(replyText)
      ) {
        const reason = reviewedReplyTextsSetRef.current.get(replyText) ?? DEFAULT_REPLY_TEXT_ISSUE
        setIsThereIssueWithReply(true)
        setIssueWithReplyText(reason)
        return true
      }

      // const { status, payload } = await checkCommentForHateSpeech(replyText)
      const status = true
      const payload = {
        isHateSpeech: true,
        reason: 'The content includes a racial slur, which is considered hate speech.',
        suggestion: 'Remove the racial slur and any offensive language. Focus on discussing the challenges and efforts of the team in a respectful manner.',
      }

      if (!status) throw payload
      if (payload.isHateSpeech) {
        const reason = payload.reason ?? DEFAULT_REPLY_TEXT_ISSUE
        reviewedReplyTextsSetRef.current.set(replyText, reason)
        setIsThereIssueWithReply(true)
        setIssueWithReplyText(reason)
        if (payload.suggestion) setFixReplySuggestion(payload.suggestion)

        return true
      }
      
      return false
    } catch (error) {
      logError({
        functionName: 'Comment.checkOwnReplyForOffensiveSpeech',
        data: replyText,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'We could not check your comment for hate speech.',
        variant: 'destructive',
      })

      return false
    }
  }

  const _addReply = async (options?: {
    bypassOwnReplyCheck?: boolean
    replyingToReply: string | null
  }) => {
    try {
      if (replyText.trim().length === 0) throw new Error('Empty reply body!')

      if (moderation.checkOwnCommentForOffensiveSpeech && !options?.bypassOwnReplyCheck) {
        const containsOffensiveSpeech = await checkOwnReplyForOffensiveSpeech(replyText!)
        if (containsOffensiveSpeech) return
      }

      const { status, payload } = await addReply({
        body: replyText,
        commentID: comment.id,
        domain: comment.domain,
        URL: comment.URL,
        URLHash: comment.URLHash,
        secondaryReplyID: options?.replyingToReply == null ?
          undefined :
          options?.replyingToReply,
      })
      if (!status) throw payload

      toast({
        title: 'Reply added!',
        description: 'Your reply has been posted.',
      })
      discardReply()
      setReplies(_replies => [
        payload,
        ..._replies,
      ])
    } catch (error) {
      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Your comment could not be posted.',
        variant: 'destructive',
      })
    } finally {
      setIsAddingReply(false)
    }
  }

  // Effects:
  // Fetches the author's details.
  useEffect(() => {
    fetchAuthor(comment.author)
  }, [comment])

  // Check if the signed-in user is following the author.
  useEffect(() => {
    if (
      !isLoading &&
      isSignedIn &&
      user
    ) checkIsSignedInUserFollowing(comment.author)
  }, [
    isLoading,
    isSignedIn,
    user,
    comment,
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
      <div className='flex flex-row space-x-4 w-full'>
        <div className='flex-none'>
          <Avatar>
            <AvatarImage src={getPhotoURLFromUID(comment.author)} alt={author?.username} />
            <AvatarFallback>{ author?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }</AvatarFallback>
          </Avatar>
          <div className='relative flex flex-col gap-1 items-center w-full h-[calc(100%-2.5rem)] my-1'>
            <div className='w-[1px] h-full bg-border-secondary' />
            <div className='absolute -bottom-6 flex flex-row w-full h-5'>
              <div className='w-1/2 h-full' />
              <div className='relative w-1/2 h-full -ml-2'>
                <div
                  className={cn(
                    'absolute flex flex-row items-center gap-3 w-max text-brand-primary group',
                    (
                      comment.replyCount > 0 &&
                      (
                        (comment.replyCount > replies.length) ||
                        (comment.replyCount <= replies.length && !isShowingReplies)
                      ) &&
                      !isFetchingReplies &&
                      !isLoadingMoreReplies
                    ) && 'cursor-pointer',
                    (isFetchingReplies || isLoadingMoreReplies) ? 'opacity-0 pointer-events-none' : 'opacity-1 pointer-events-auto',
                  )}
                  onClick={() => {
                    if (comment.replyCount > 0) {
                      if (
                        isShowingReplies &&
                        comment.replyCount > replies.length
                      ) loadMoreReplies()
                      else showReplies()
                    }
                  }}
                >
                  {
                    comment.replyCount > 0 ? (
                      <>
                        {
                          (comment.replyCount > replies.length && !areThereNoMoreRepliesToLoad) ? (
                            <>
                              <CirclePlusIcon
                                className='w-4 h-4 transition-all opacity-1'
                                strokeWidth={1.75}
                              />
                              <div className='font-medium text-xs select-none group-hover:underline'>
                                {
                                  isShowingReplies ? (
                                    <>
                                      Load more replies
                                    </>
                                  ) : (
                                    <>
                                      { millify(comment.replyCount) } { simplur`${[comment.replyCount]} repl[y|ies]` }
                                    </>
                                  )
                                }
                              </div>
                            </>
                          ) : (
                            <>
                              {
                                isShowingReplies ? (
                                  <CircleIcon
                                    className='w-1.5 h-1.5 -mt-1.5 ml-[5px] text-border-secondary fill-border-secondary'
                                    strokeWidth={1.75}
                                  />
                                ) : (
                                  <>
                                    <CirclePlusIcon
                                      className='w-4 h-4 transition-all opacity-1'
                                      strokeWidth={1.75}
                                    />
                                    <div className='font-medium text-xs select-none group-hover:underline'>
                                      { millify(comment.replyCount) } { simplur`${[comment.replyCount]} repl[y|ies]` }
                                    </div>
                                  </>
                                )
                              }
                            </>
                          )
                        }
                      </>
                    ) : (
                      <CircleIcon
                        className='w-1.5 h-1.5 -mt-1.5 ml-[5px] text-border-secondary fill-border-secondary'
                        strokeWidth={1.75}
                      />
                    )
                  }
                </div>
              </div>
            </div>
          </div>
        </div>  
        <div className='flex-initial w-full'>
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
                      <AvatarImage src={getPhotoURLFromUID(comment.author)} alt={author?.username} />
                      <AvatarFallback>{ author?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }</AvatarFallback>
                    </Avatar>
                    {
                      (!isLoading && isSignedIn && user && !isFetchingAuthor) && (
                        <>
                          {
                            user.uid === comment.author ? (
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
              <p className='cursor-pointer hover:underline'>{ageOfComment}</p>
            </div>
            <div className='text-sm'>
              <pre className='whitespace-pre-wrap font-sans'>
                {isExpanded ? comment.body : truncatedText}
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
            <CommentAction
              comment={comment}
              fetchComment={async () => {}}
              toggleReplyToComment={
                isReplyTextAreaEnabled ?
                () => {
                  if (replyText.trim().length === 0) discardReply()
                  else setShowCancelReplyAlertDialog(true)
                } : () => setIsReplyTextAreaEnabled(true)
              }
              isShowingReplies={isShowingReplies}
              setIsShowingReplies={setIsShowingReplies}
              showReplies={showReplies}
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
                            onClick={() => _addReply({ bypassOwnReplyCheck: true, replyingToReply: null })}
                            disabled={isAddingReply || replyText.trim().length === 0}
                          >
                            Reply Anyway
                          </Button>
                        ) : (
                          <Button
                            size='sm'
                            className='h-8 px-4 py-2 transition-all'
                            variant='default'
                            onClick={() => _addReply()}
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
            <div
              className={cn(
                'flex flex-col gap-2 w-full -ml-3.5',
                isShowingReplies ? 'h-fit pt-2 overflow-y-visible' : 'h-0 pt-0 overflow-y-hidden',
                isFetchingReplies && 'justify-center items-center h-10',
              )}
            >
              {
                isFetchingReplies ? (
                  <div className='flex justify-center items-center flex-row gap-2 select-none'>
                    <LoadingIcon className='w-4 h-4 text-brand-tertiary' />
                    <p className='text-xs text-brand-secondary'>Loading replies..</p>
                  </div>
                ) : (
                  <>
                    {
                      replies
                        .filter(reply => (
                          !reply.isDeleted &&
                          !reply.isRemoved &&
                          !reply.isRestricted &&
                          (
                            moderation.unsafeContentPolicy === UnsafeContentPolicy.FilterUnsafeContent ?
                            !reply.hateSpeech.isHateSpeech : true
                          )
                        ))
                        .map(reply => (
                          <Reply
                            key={reply.id}
                            reply={reply}
                            _addReply={_addReply}
                            isAddingReply={isAddingReply}
                          />
                        ))
                    }
                    {
                      isLoadingMoreReplies ? (
                        <div className='flex justify-center items-center flex-row gap-2 select-none translate-y-2'>
                          <LoadingIcon className='w-4 h-4 text-brand-tertiary' />
                          <p className='text-xs text-brand-secondary'>Loading more replies..</p>
                        </div>
                      ) : (
                        <div className='w-full' />
                      )
                    }
                  </>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Exports:
export default Comment
