// Packages:
import { useState, useEffect } from 'react'
import { cn } from '@/entrypoints/content/lib/utils'
import { getRDBUser } from '@/entrypoints/content/firebase/realtime-database/users/get'
import getPhotoURLFromUID from '@/entrypoints/content/utils/getPhotoURLFromUID'
import prettyMilliseconds from 'pretty-ms'
import { isEmpty } from 'lodash'
import { useNavigate } from 'react-router-dom'
import pastellify from 'pastellify'

// Typescript:
import type {
  ReplyID,
  Reply as ReplyInterface,
} from 'types/comments-and-replies'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { Timestamp } from 'firebase/firestore'
import type { UID } from 'types/user'

// Imports:
import { CircleHelpIcon, XIcon } from 'lucide-react'
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

// Functions:
const Reply = ({
  reply,
  _addReply,
  isAddingReply,
}: {
  reply: ReplyInterface
  _addReply: (replyText: string, options?: {
    bypassOwnReplyCheck?: boolean
    replyingToReply: string | null
  }) => Promise<void>
  isAddingReply: boolean
}) => {
  // Constants:
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

  // State:
  const [isFetchingAuthor, setIsFetchingAuthor] = useState(false)
  const [author, setAuthor] = useState<RealtimeDatabaseUser | null>(null)
  const [isReplyTextAreaEnabled, setIsReplyTextAreaEnabled] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyingToReply, setReplyingToReply] = useState<null | ReplyID>(null)
  const [isThereIssueWithReply, setIsThereIssueWithReply] = useState(false)
  const [issueWithReplyText, setIssueWithReplyText] = useState<string | null>(null)
  const [fixReplySuggestion, setFixReplySuggestion] = useState<string | null>(null)
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
    setReplyingToReply(null)
    setIsThereIssueWithReply(false)
    setIssueWithReplyText(null)
    setFixReplySuggestion(null)
    setShowCancelReplyAlertDialog(false)
  }

  // Effects:
  // Fetches the author's details.
  useEffect(() => {
    fetchAuthor(reply.author)
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
      <div className='flex flex-row space-x-4'>
        <div className='relative flex-none'>
          <div className='absolute top-0 left-[calc(-1.375rem-0.5px)] w-[calc(1.375rem+0.5px)] h-5 border-b-[1px] border-b-border-secondary border-l-[1px] border-l-border-secondary rounded-bl-xl' />
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
              toggleReplyToReply={() => {
                setReplyingToReply(reply.id)
                setIsReplyTextAreaEnabled(true)
              }}
            />
            {
              isReplyTextAreaEnabled && (
                <div className='flex flex-col gap-2.5 w-full'>
                  {
                    replyingToReply !== null && (
                      <div className='flex justify-between items-center w-full h-7 px-2 bg-overlay rounded'>
                        <p className='font-medium text-xs text-brand-secondary'>Replying to @{author?.username}</p>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='h-5 w-5 p-0.5 text-brand-tertiary rounded-full hover:bg-border-secondary'
                          onClick={() => setReplyingToReply(null)}
                        >
                          <XIcon className='h-4 w-4' />
                        </Button>
                      </div>
                    )
                  }
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
                            onClick={() => _addReply(replyText, { bypassOwnReplyCheck: true, replyingToReply })}
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
                            onClick={() => _addReply(replyText, { replyingToReply })}
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
export default Reply
