// Packages:
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/entrypoints/content/lib/utils'
import { getRDBUser } from '@/entrypoints/content/firebase/realtime-database/users/get'
import getPhotoURLFromUID from '@/entrypoints/content/utils/getPhotoURLFromUID'
import prettyMilliseconds from 'pretty-ms'
import { useToast } from '../ui/use-toast'
import { isEmpty } from 'lodash'
import useUserPreferences from '@/entrypoints/content/hooks/useUserPreferences'
import { checkCommentForHateSpeech } from '../../firebase/firestore-database/comment/get'
import { addReply } from '@/entrypoints/content/firebase/firestore-database/reply/set'
import { useNavigate } from 'react-router-dom'
import pastellify from 'pastellify'
import getURLHash from 'utils/getURLHash'

// Typescript:
import type { Comment as CommentInterface } from 'types/comments-and-replies'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { Timestamp } from 'firebase/firestore'
import type { UID } from 'types/user'
import { UnsafeContentPolicy } from 'types/user-preferences'

// Imports:
import { CircleHelpIcon } from 'lucide-react'
import LoadingIcon from '../primary/LoadingIcon'

// Constants:
import { SECOND } from 'time-constants'

// Components:
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar'
import CommentAction from '../secondary/CommentAction'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card'
import { Separator } from '../ui/separator'
import { Skeleton } from '../ui/skeleton'
import UserHoverCard from '../secondary/UserHoverCard'
import URLPreview from '../secondary/URLPreview'

// Functions:
const CommentStandalone = ({ comment }: { comment: CommentInterface }) => {
  // Constants:
  const { toast } = useToast()
  const { moderation } = useUserPreferences()
  const navigate = useNavigate()
  const MAX_LINES = 5
  const MAX_CHARS = 350
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
  const [isReplyTextAreaEnabled, setIsReplyTextAreaEnabled] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isThereIssueWithReply, setIsThereIssueWithReply] = useState(false)
  const [issueWithReplyText, setIssueWithReplyText] = useState<string | null>(null)
  const [fixReplySuggestion, setFixReplySuggestion] = useState<string | null>(null)
  const [isAddingReply, setIsAddingReply] = useState(false)
  const [showCancelReplyAlertDialog, setShowCancelReplyAlertDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [blurUnsafeContent, setBlurUnsafeContent] = useState(
    moderation.unsafeContentPolicy === UnsafeContentPolicy.BlurUnsafeContent &&
    comment.hateSpeech.isHateSpeech
  )

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

      const { status, payload } = await checkCommentForHateSpeech(replyText)

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
      setIsAddingReply(true)
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
        URLHash: await getURLHash(comment.URLHash),
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
      <div className='flex flex-row space-x-4 w-full pb-6'>
        <div className='flex-none'>
          <Avatar onClick={() => author?.username && navigate(`/u/${ author.username }`)}>
            <AvatarImage src={getPhotoURLFromUID(comment.author)} alt={author?.username} />
            <AvatarFallback
              className='select-none'
              style={
                comment.author ? {
                  backgroundColor: pastellify(comment.author, { toCSS: true })
                } : {}
              }
            >
              { author?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }
            </AvatarFallback>
          </Avatar>
        </div>
        <div className='flex-initial w-full'>
          <div className='flex flex-col space-y-1 text-sm'>
            <div className='flex items-center space-x-1.5 text-brand-tertiary'>
              <UserHoverCard
                isFetchingUser={isFetchingAuthor}
                UID={comment.author}
                fullName={author?.fullName}
                username={author?.username}
                bio={author?.bio}
                followingCount={author?.followingCount}
                followerCount={author?.followerCount}
                joinDate={author?.joinDate}
              >
                <h1 className='font-semibold text-brand-primary cursor-pointer hover:underline'>
                  {
                    isFetchingAuthor ?
                    <Skeleton className='h-4 w-28' /> : (
                      <p
                        onClick={() => author?.username && navigate(`/u/${ author.username }`)}
                      >
                        {author?.fullName}
                      </p>
                    )
                  }
                </h1>
              </UserHoverCard>
              {
                isFetchingAuthor ?
                <Skeleton className='h-4 w-16' /> : (
                  <p className='cursor-pointer'
                    onClick={() => author?.username && navigate(`/u/${ author.username }`)}
                  >
                    {author?.username}
                  </p>
                )
              }
              <p className='self-center'>·</p>
              <p className='cursor-pointer hover:underline'>{ageOfComment}</p>
            </div>
            <div className='relative text-sm'>
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
              {
                blurUnsafeContent && (
                  <div
                    className={cn(
                      'absolute top-[-4px] left-[-8px] flex justify-center items-center w-[calc(100%+8px)] h-[calc(100%+8px)] transition-all',
                      blurUnsafeContent ? 'backdrop-blur-sm' : 'backdrop-blur-none',
                    )}
                  >
                    <Button
                      size='sm'
                      onClick={() => setBlurUnsafeContent(false)}
                    >
                      Show unsafe comment
                    </Button>
                  </div>
                )
              }
            </div>
            <div className='w-full pt-3.5'>
              <URLPreview
                URL={comment.URL}
                URLHash={comment.URLHash}
              />
            </div>
            <CommentAction
              isForStandalone
              comment={comment}
              fetchComment={async () => {}}
              toggleReplyToComment={
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
                    disabled={isAddingReply}
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
                            className='flex flex-row gap-1.5 h-8 px-4 py-2 transition-all'
                            variant='destructive'
                            onClick={() => _addReply({ bypassOwnReplyCheck: true, replyingToReply: null })}
                            disabled={isAddingReply || replyText.trim().length === 0}
                          >
                            {
                              isAddingReply ? (
                                <>
                                  <LoadingIcon className='w-4 h-4 text-white' />
                                  <span>Replying..</span>
                                </>
                              ) : 'Reply Anyway'
                            }
                          </Button>
                        ) : (
                          <Button
                            size='sm'
                            className='flex flex-row gap-1.5 h-8 px-4 py-2 transition-all'
                            variant='default'
                            onClick={() => _addReply()}
                            disabled={isAddingReply || replyText.trim().length === 0}
                          >
                            {
                              isAddingReply ? (
                                <>
                                  <LoadingIcon className='w-4 h-4 text-white' />
                                  <span>Replying..</span>
                                </>
                              ) : 'Reply'
                            }
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
export default CommentStandalone
