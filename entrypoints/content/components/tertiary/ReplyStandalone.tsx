// Packages:
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/entrypoints/content/lib/utils'
import { getRDBUser } from '@/entrypoints/content/firebase/realtime-database/users/get'
import getPhotoURLFromUID from '@/entrypoints/content/utils/getPhotoURLFromUID'
import prettyMilliseconds from 'pretty-ms'
import { useToast } from '../ui/use-toast'
import { isEmpty } from 'lodash'
import useUserPreferences from '@/entrypoints/content/hooks/useUserPreferences'
import { checkCommentForHateSpeech, getComment } from '../../firebase/firestore-database/comment/get'
import { addReply } from '@/entrypoints/content/firebase/firestore-database/reply/set'
import { useNavigate } from 'react-router-dom'
import pastellify from 'pastellify'
import { getReply } from '../../firebase/firestore-database/reply/get'
import getURLHash from 'utils/getURLHash'

// Typescript:
import type { CommentID, ContentHateSpeechResult, ReplyID, Reply as ReplyInterface } from 'types/comments-and-replies'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { Timestamp } from 'firebase/firestore'
import type { UID } from 'types/user'
import { UnsafeContentPolicy } from 'types/user-preferences'
import type { URLHash } from 'types/websites'

// Imports:
import { CircleHelpIcon } from 'lucide-react'
import LoadingIcon from '../primary/LoadingIcon'

// Constants:
import { SECOND } from 'time-constants'
import { TALKS_ABOUT_THRESHOLD } from 'constants/database/topics'

// Components:
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar'
import ReplyAction from '../secondary/ReplyAction'
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
import EmbeddedPost from './EmbeddedPost'

// Functions:
const ReplyStandalone = ({ reply }: { reply: ReplyInterface }) => {
  // Constants:
  const { toast } = useToast()
  const { moderation } = useUserPreferences()
  const navigate = useNavigate()
  const MAX_LINES = 5
  const MAX_CHARS = 350
  const shouldTruncate = reply.body.split('\n').length > MAX_LINES || reply.body.length > MAX_CHARS
  const truncatedText = shouldTruncate
    ? reply.body.split('\n').slice(0, MAX_LINES).join('\n').slice(0, MAX_CHARS)
    : reply.body
  const replyAgeInMilliseconds = Math.round((reply.createdAt as Timestamp).seconds * 10 ** 3)
  const ageOfReply = (Date.now() - replyAgeInMilliseconds) > 30 * SECOND ?
    prettyMilliseconds(Date.now() - replyAgeInMilliseconds, { compact: true }) :
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
    reply.hateSpeech.isHateSpeech
  )
  const [isLoadingEmbeddedPost, setIsLoadingEmbeddedPost] = useState(false)
  const [embeddedPost, setEmbeddedPost] = useState<{
    UID: UID
    body: string
    createdAt: Timestamp
    hateSpeech: ContentHateSpeechResult
  }>()

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
        functionName: 'ReplyStandalone.fetchAuthor',
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
        functionName: 'ReplyStandalone.checkOwnReplyForOffensiveSpeech',
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
        commentID: reply.id,
        domain: reply.domain,
        URL: reply.URL,
        URLHash: await getURLHash(reply.URLHash),
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
      logError({
        functionName: 'ReplyStandalone._addReply',
        data: replyText,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Your comment could not be posted.',
        variant: 'destructive',
      })
    } finally {
      setIsAddingReply(false)
    }
  }

  const fetchEmbeddedPost = async ({
    URLHash,
    commentID,
    secondaryReplyID,
  }: {
    URLHash: URLHash
    commentID: CommentID
    secondaryReplyID?: ReplyID
  }) => {
    try {
      if (isLoadingEmbeddedPost) return
      setIsLoadingEmbeddedPost(true)
      if (secondaryReplyID) {
        const {
          status: getReplyStatus,
          payload: getReplyPayload,
        } = await getReply({
          URLHash,
          commentID,
          replyID: secondaryReplyID,
        })
        if (!getReplyStatus) throw getReplyPayload
        if (getReplyPayload) {
          setEmbeddedPost({
            UID: getReplyPayload.author,
            body: getReplyPayload.body,
            createdAt: getReplyPayload.createdAt as Timestamp,
            hateSpeech: getReplyPayload.hateSpeech,
          })
        }
      } else {
        const {
          status: getCommentStatus,
          payload: getCommentPayload,
        } = await getComment({
          URLHash,
          commentID,
        })
        if (!getCommentStatus) throw getCommentPayload
        if (getCommentPayload) {
          setEmbeddedPost({
            UID: getCommentPayload.author,
            body: getCommentPayload.body,
            createdAt: getCommentPayload.createdAt as Timestamp,
            hateSpeech: getCommentPayload.hateSpeech,
          })
        }
      }
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 comment, resulting in too many error toasts.
      logError({
        functionName: 'ReplyStandalone.fetchEmbeddedPost',
        data: {
          URLHash,
          commentID,
          secondaryReplyID,
        },
        error,
      })
    } finally {
      setIsLoadingEmbeddedPost(false)
    }
  }

  // Effects:
  // Fetches the author's details and embedded post.
  useEffect(() => {
    fetchAuthor(reply.author)
    fetchEmbeddedPost({
      URLHash: reply.URLHash,
      commentID: reply.commentID,
      secondaryReplyID: reply.secondaryReplyID,
    })
  }, [reply])

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
          <Avatar className='cursor-pointer' onClick={() => author?.username && navigate(`/u/${ author.username }`)}>
            <AvatarImage src={getPhotoURLFromUID(reply.author)} alt={author?.username} />
            <AvatarFallback
              className='select-none'
              style={
                reply.author ? {
                  backgroundColor: pastellify(reply.author, { toCSS: true })
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
                UID={reply.author}
                fullName={author?.fullName}
                username={author?.username}
                bio={author?.bio}
                followingCount={author?.followingCount}
                followerCount={author?.followerCount}
                joinDate={author?.joinDate}
                talksAbout={(author?.commentCount ?? 0) > TALKS_ABOUT_THRESHOLD ? author?.talksAbout : undefined}
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
                    @{author?.username}
                  </p>
                )
              }
              <p className='self-center'>·</p>
              <p className='cursor-pointer hover:underline'>{ageOfReply}</p>
            </div>
            <div className='relative text-sm'>
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
                      Show unsafe reply
                    </Button>
                  </div>
                )
              }
            </div>
            {
              (embeddedPost && !isLoadingEmbeddedPost) ? (
                <EmbeddedPost
                  {...embeddedPost}
                  URL={reply.URL}
                  URLHash={reply.URLHash}
                />
              ) : (
                <Skeleton className='w-full h-28' />
              )
            }
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
                  <div className='flex justify-between items-center w-full h-7 px-2 bg-overlay rounded'>
                    <p className='font-medium text-xs text-brand-secondary'>Replying to @{author?.username}</p>
                  </div>
                  <Textarea
                    className={cn(
                      'h-16 resize-none',
                      isThereIssueWithReply && 'border-2 border-rose-600'
                    )}
                    placeholder='Share your thoughts'
                    value={replyText}
                    onChange={event => {
                      event.stopPropagation()
                      setReplyText(event.target.value)
                    }}
                    onKeyDown={event => event.stopPropagation()}
                    onKeyDownCapture={event => event.stopPropagation()}
                    onKeyUp={event => event.stopPropagation()}
                    onKeyUpCapture={event => event.stopPropagation()}
                    onKeyPress={event => event.stopPropagation()}
                    onKeyPressCapture={event => event.stopPropagation()}
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
                        className='flex flex-row gap-1.5 h-8 px-4 py-2 transition-all'
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
                            onClick={() => _addReply({ bypassOwnReplyCheck: true, replyingToReply: reply.id })}
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
                            onClick={() => _addReply({ replyingToReply: reply.id })}
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
export default ReplyStandalone
