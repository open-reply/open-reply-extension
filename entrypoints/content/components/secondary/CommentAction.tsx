// Packages:
import { useState } from 'react'
import { cn } from '@/entrypoints/content/lib/utils'
import { getCommentVote } from '@/entrypoints/content/firebase/realtime-database/votes/get'
import { useToast } from '../ui/use-toast'
import useAuth from '@/entrypoints/content/hooks/useAuth'
import {
  downvoteComment,
  upvoteComment,
} from '@/entrypoints/content/firebase/firestore-database/comment/set'
import useUtility from '@/entrypoints/content/hooks/useUtility'

// Typescript:
import type { Comment } from 'types/comments-and-replies'
import { VoteType } from 'types/votes'

interface BaseCommentActionProps {
  comment: Comment
  fetchComment: () => Promise<void>
  toggleReplyToComment: () => void
}

interface StandaloneCommentActionProps extends BaseCommentActionProps {
  isForStandalone: true
}

interface RegularCommentActionProps extends BaseCommentActionProps {
  isForStandalone?: false
  isShowingReplies: boolean
  setIsShowingReplies: React.Dispatch<React.SetStateAction<boolean>>
  showReplies: () => Promise<void>
}

type CommentActionProps = StandaloneCommentActionProps | RegularCommentActionProps

// Imports:
import {
  ArrowBigDownIcon,
  ArrowBigUpIcon,
  BookmarkIcon,
  CameraIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  EllipsisIcon,
  FlagIcon,
  ForwardIcon,
  MessageSquareIcon,
} from 'lucide-react'

// Components:
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

// Functions:
const CommentAction = ({
  isForStandalone,
  comment,
  fetchComment,
  toggleReplyToComment,
  ...props
}: CommentActionProps) => {
  // Constants:
  const {
    isShowingReplies,
    setIsShowingReplies,
    showReplies,
  } = isForStandalone ? {
    isShowingReplies: false,
    setIsShowingReplies: () => {},
    showReplies: () => {},
  } : {
    ...props as RegularCommentActionProps,
  }
  const { toast } = useToast()
  const {
    currentURL,
    currentURLHash,
  } = useUtility()
  const {
    isLoading,
    isSignedIn,
    user,
  } = useAuth()

  // State:
  const [isUserVoteFetched, setIsUserVoteFetched] = useState(false)
  const [userVote, setUserVote] = useState<VoteType | undefined>()
  const [isVoting, setIsVoting] = useState(false)
  const [voteCount, setVoteCount] = useState(comment.voteCount.up - comment.voteCount.down)

  // Functions:
  const fetchUserVote = async () => {
    try {
      const { status, payload } = await getCommentVote({ commentID: comment.id })
      if (!status) throw payload

      setUserVote(payload?.vote)
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 comment, resulting in too many error toasts.
      logError({
        functionName: 'CommentAction.fetchUserVote',
        data: null,
        error,
      })
    } finally {
      setIsUserVoteFetched(true)
    }
  }

  const handleUpvote = async () => {
    const _oldUserVote = userVote
    const _oldVoteCount = voteCount

    try {
      if (
        !currentURL ||
        !currentURLHash
      ) return
      setIsVoting(true)

      let _userVote: VoteType | undefined = undefined
      if (userVote === VoteType.Upvote) {
        setVoteCount(_voteCount => _voteCount - 1)
        _userVote = undefined
      } else if (userVote === VoteType.Downvote) {
        setVoteCount(_voteCount => _voteCount + 2)
        _userVote = VoteType.Upvote
      } else {
        setVoteCount(_voteCount => _voteCount + 1)
        _userVote = VoteType.Upvote
      }
      setUserVote(_userVote)

      const { status, payload } = await upvoteComment({
        URL: currentURL,
        URLHash: currentURLHash,
        commentID: comment.id,
      })
      if (!status) throw payload

      // In the event that the user voted on this elsewhere, we fetch the comment again to sync the vote and the vote count.
      if (payload?.vote !== _userVote) {
        setUserVote(payload?.vote)
        await fetchComment()
      }
    } catch (error) {
      setUserVote(_oldUserVote)
      setVoteCount(_oldVoteCount)

      logError({
        functionName: 'CommentAction.handleUpvote',
        data: {
          URL: currentURL,
          URLHash: currentURLHash,
          commentID: comment.id,
        },
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsVoting(false)
    }
  }
  
  const handleDownvote = async () => {
    const _oldUserVote = userVote
    const _oldVoteCount = voteCount

    try {
      if (
        !currentURL ||
        !currentURLHash
      ) return
      setIsVoting(true)

      let _userVote: VoteType | undefined = undefined
      if (userVote === VoteType.Downvote) {
        setVoteCount(_voteCount => _voteCount + 1)
        _userVote = undefined
      } else if (userVote === VoteType.Upvote) {
        setVoteCount(_voteCount => _voteCount - 2)
        _userVote = VoteType.Downvote
      } else {
        setVoteCount(_voteCount => _voteCount - 1)
        _userVote = VoteType.Downvote
      }
      setUserVote(_userVote)

      const { status, payload } = await downvoteComment({
        URL: currentURL,
        URLHash: currentURLHash,
        commentID: comment.id,
      })
      if (!status) throw payload

      // In the event that the user voted on this elsewhere, we fetch the comment again to sync the vote and the vote count.
      if (payload?.vote !== _userVote) {
        setUserVote(payload?.vote)
        await fetchComment()
      }
    } catch (error) {
      setUserVote(_oldUserVote)
      setVoteCount(_oldVoteCount)

      logError({
        functionName: 'CommentAction.handleDownvote',
        data: {
          URL: currentURL,
          URLHash: currentURLHash,
          commentID: comment.id,
        },
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsVoting(false)
    }
  }

  // Effects:
  // Fetch the signed-in user's vote.
  useEffect(() => {
    if (
      !isUserVoteFetched &&
      !isLoading &&
      isSignedIn &&
      user
    ) fetchUserVote()
  }, [
    isUserVoteFetched,
    isLoading,
    isSignedIn,
  ])

  // Return:
  return (
    <div className='relative flex space-x-1 items-center -mt-2 text-brand-primary'>
      <div className='flex space-x-1 items-center -ml-2 mr-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='w-7 h-7 rounded-full'
            >
              <ArrowBigUpIcon
                size={18}
                strokeWidth={1.5}
                className={
                  cn(
                    'transition-all',
                    userVote === VoteType.Upvote ? 'text-green fill-green' : 'border-brand-primary',
                    isVoting && 'pointer-events-none opacity-90',
                  )
                }
                onClick={handleUpvote}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className='select-none'>Upvote</p>
          </TooltipContent>
        </Tooltip>
        <p className='text-xs font-medium'>{voteCount}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='w-7 h-7 rounded-full'
            >
              <ArrowBigDownIcon
                size={18}
                strokeWidth={1.5}
                className={
                  cn(
                    'transition-all',
                    userVote === VoteType.Downvote ? 'text-red fill-red' : 'border-brand-primary',
                    isVoting && 'pointer-events-none opacity-90',
                  )
                }
                onClick={handleDownvote}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className='select-none'>Downvote</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Button
        variant='ghost'
        size='sm'
        className='flex space-x-1 items-center h-6 px-2 py-2 rounded-lg'
        onClick={toggleReplyToComment}
      >
        <MessageSquareIcon size={14} strokeWidth={1.75} />
        <p className='text-xs'>Reply</p>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='flex space-x-1 items-center h-6 px-2 py-2 rounded-lg'
          >
            <ForwardIcon size={18} strokeWidth={1.75} />
            <p className='text-xs'>Share</p>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className='flex space-x-2 items-center cursor-pointer'>
            <ForwardIcon size={16} strokeWidth={1.75} />
            <p className='text-xs font-medium'>Repost Comment</p>
          </DropdownMenuItem>
          <DropdownMenuItem className='flex space-x-2 items-center cursor-pointer'>
            <CameraIcon size={16} strokeWidth={1.75} />
            <p className='text-xs font-medium'>Share As Screenshot</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='flex justify-center items-center w-7 h-6 rounded-lg'
          >
            <EllipsisIcon size={18} strokeWidth={1} className='fill-brand-primary' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className='flex space-x-2 items-center text-rose-600 cursor-pointer hover:!bg-rose-200 hover:!text-rose-600'>
            <FlagIcon size={16} strokeWidth={1.75} />
            <p className='text-xs font-medium'>Report</p>
          </DropdownMenuItem>
          <DropdownMenuItem className='flex space-x-2 items-center cursor-pointer'>
            <BookmarkIcon size={16} strokeWidth={1.75} />
            <p className='text-xs font-medium'>Save</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {
        !isForStandalone && (
          <div
            className={cn(
              'absolute -left-12 text-brand-primary group transition-all',
              isShowingReplies! ? 'top-1.5 opacity-1 cursor-pointer' : 'top-10 opacity-0 pointer-events-none',
            )}
            onClick={() => {
              if (isShowingReplies!) setIsShowingReplies(false)
              else showReplies!()
            }}
          >
            <div className='relative w-4 h-4'>
              <CircleMinusIcon
                className={cn(
                  'absolute w-4 h-4 transition-all bg-white',
                  isShowingReplies! ? 'opacity-1' : 'opacity-0'
                )}
                strokeWidth={1.75}
              />
              <CirclePlusIcon
                className={cn(
                  'absolute w-4 h-4 transition-all bg-white',
                  isShowingReplies! ? 'opacity-0' : 'opacity-1'
                )}
                strokeWidth={1.75}
              />
            </div>
          </div>
        )
      }
    </div>
  )
}

// Exports:
export default CommentAction
