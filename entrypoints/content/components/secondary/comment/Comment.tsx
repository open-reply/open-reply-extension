// Packages:
import { getPostedTimeDistanceFromNow } from '@/entrypoints/content/utils/timeHelpers'
import { cn } from '@/entrypoints/content/lib/utils'

// Typescript:
import type { Comment } from 'types/comments-and-replies'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { Timestamp } from 'firebase/firestore'

interface CommentProps {
  user: Partial<RealtimeDatabaseUser>,
  comment: Comment
}

// Imports:
import {
  CalendarDaysIcon,
  CircleHelpIcon,
} from 'lucide-react'

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

// Functions:
const Comment = ({ user: { fullName, username }, comment }: CommentProps) => {
  // State:
  const [isReplyTextAreaEnabled, setIsReplyTextAreaEnabled] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isThereIssueWithReply, setIsThereIssueWithReply] = useState(false)
  const [issueWithReplyText, setIssueWithReplyText] = useState<string | null>(null)
  const [fixReplySuggestion, setFixReplySuggestion] = useState<string | null>(null)
  const [isAddingReply, setIsAddingReply] = useState(false)
  const [showCancelReplyAlertDialog, setShowCancelReplyAlertDialog] = useState(false)

  // Functions:
  const discardReply = () => {
    setIsReplyTextAreaEnabled(false)
    setReplyText('')
    setIsThereIssueWithReply(false)
    setIssueWithReplyText(null)
    setFixReplySuggestion(null)
    setShowCancelReplyAlertDialog(false)
  }

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
      <div className='flex m-4 space-x-4'>
        <div className='flex-none'>
          <Avatar>
            <AvatarImage src={'https://github.com/shadcn.png'} alt={username} />
            <AvatarFallback>BH</AvatarFallback>
          </Avatar>
        </div>
        <div className='flex-initial'>
          <div className='flex flex-col space-y-1 text-sm'>
            <div className='flex items-center space-x-1.5 text-brand-tertiary'>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <h1 className='font-semibold text-brand-primary cursor-pointer hover:underline'>{fullName}</h1>
                </HoverCardTrigger>
                <HoverCardContent className='w-80 text-brand-primary'>
                  <div className='flex justify-between space-x-4'>
                    <Avatar className='w-16 h-16'>
                      <AvatarImage src={'https://github.com/shadcn.png'} />
                      <AvatarFallback>BH</AvatarFallback>
                    </Avatar>
                    <Button
                      // variant={isFollowing ? 'outline' : 'default'}
                      variant='default'
                      className='h-9 mt-2'
                      // onClick={toggleFollow}
                    >
                      {/* {isFollowing ? 'Unfollow' : 'Follow'} */}
                      Follow
                    </Button>
                  </div>
                  <div className='flex flex-row space-x-1.5 mt-3'>
                    <h4 className='text-sm font-semibold'>{fullName}</h4>
                    <p className='text-sm text-brand-tertiary'>{username}</p>
                  </div>
                  <p className='text-sm mt-2'>Software engineer | Open source enthusiast | Coffee lover</p>
                  <div className='flex items-center pt-2 space-x-4'>
                    <div className='flex items-center text-sm text-brand-tertiary'>
                      <span className='font-semibold text-brand-primary mr-1'>{567}</span> Following
                    </div>
                    <div className='flex items-center text-sm text-brand-tertiary'>
                      <span className='font-semibold text-brand-primary mr-1'>{1234}</span> Followers
                    </div>
                  </div>
                  <div className='flex items-center pt-2'>
                    <CalendarDaysIcon className='mr-2 h-4 w-4 opacity-70' />{' '}
                    <span className='text-xs text-brand-tertiary'>Joined December 2021</span>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <p className='cursor-pointer'>{username}</p>
              <p className='self-center'>·</p>
              <p className='cursor-pointer hover:underline'>
                {
                  comment.createdAt instanceof Timestamp ?
                  getPostedTimeDistanceFromNow((comment.createdAt as Timestamp).toDate()) :
                  '17h'
                }
              </p>
            </div>
            <div className='text-sm'>{comment.body}</div>
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
                            // onClick={() => _addReply({ bypassOwnCommentCheck: true })}
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
export default Comment
