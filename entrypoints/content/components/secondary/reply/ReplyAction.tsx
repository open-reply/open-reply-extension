// Packages:
import { useState } from 'react'
import { cn } from '@/entrypoints/content/lib/utils'
import { getReplyVote } from '@/entrypoints/content/firebase/realtime-database/votes/get'
import { useToast } from '../../ui/use-toast'
import useAuth from '@/entrypoints/content/hooks/useAuth'
import {
  downvoteReply,
  upvoteReply,
} from '@/entrypoints/content/firebase/firestore-database/reply/set'
import useUtility from '@/entrypoints/content/hooks/useUtility'

// Typescript:
import type { Reply } from 'types/comments-and-replies'
import { VoteType } from 'types/votes'

// Imports:
import {
  ArrowBigDownIcon,
  ArrowBigUpIcon,
  BookmarkIcon,
  CameraIcon,
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
} from '../../ui/tooltip'
import { Button } from '../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'

// Functions:
const ReplyAction = ({
  reply,
  fetchReply,
  toggleReplyToReply,
}: {
  reply: Reply
  fetchReply: () => Promise<void>
  toggleReplyToReply: () => void
}) => {
  // Constants:
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
  const [voteCount, setVoteCount] = useState(reply.voteCount.up - reply.voteCount.down)

  // Functions:
  const fetchUserVote = async () => {
    try {
      const { status, payload } = await getReplyVote({ replyID: reply.id })
      if (!status) throw payload

      setUserVote(payload?.vote)
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 reply, resulting in too many error toasts.
      logError({
        functionName: 'ReplyAction.fetchUserVote',
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

      const { status, payload } = await upvoteReply({
        URL: currentURL,
        URLHash: currentURLHash,
        replyID: reply.id,
        commentID: reply.commentID,
      })
      if (!status) throw payload

      // In the event that the user voted on this elsewhere, we fetch the reply again to sync the vote and the vote count.
      if (payload?.vote !== _userVote) {
        setUserVote(payload?.vote)
        await fetchReply()
      }
    } catch (error) {
      setUserVote(_oldUserVote)
      setVoteCount(_oldVoteCount)

      logError({
        functionName: 'ReplyAction.handleUpvote',
        data: {
          URL: currentURL,
          URLHash: currentURLHash,
          replyID: reply.id,
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

      const { status, payload } = await downvoteReply({
        URL: currentURL,
        URLHash: currentURLHash,
        replyID: reply.id,
        commentID: reply.commentID,
      })
      if (!status) throw payload

      // In the event that the user voted on this elsewhere, we fetch the reply again to sync the vote and the vote count.
      if (payload?.vote !== _userVote) {
        setUserVote(payload?.vote)
        await fetchReply()
      }
    } catch (error) {
      setUserVote(_oldUserVote)
      setVoteCount(_oldVoteCount)

      logError({
        functionName: 'ReplyAction.handleDownvote',
        data: {
          URL: currentURL,
          URLHash: currentURLHash,
          replyID: reply.id,
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
    <div className='flex space-x-1 items-center -mt-2 text-brand-primary'>
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
        onClick={toggleReplyToReply}
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
            <p className='text-sm font-medium'>Repost Reply</p>
          </DropdownMenuItem>
          <DropdownMenuItem className='flex space-x-2 items-center cursor-pointer'>
            <CameraIcon size={16} strokeWidth={1.75} />
            <p className='text-sm font-medium'>Share As Screenshot</p>
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
          <DropdownMenuItem className='flex space-x-2 items-center cursor-pointer'>
            <FlagIcon size={16} strokeWidth={1.75} />
            <p className='text-sm font-medium'>Report</p>
          </DropdownMenuItem>
          <DropdownMenuItem className='flex space-x-2 items-center cursor-pointer'>
            <BookmarkIcon size={16} strokeWidth={1.75} />
            <p className='text-sm font-medium'>Save</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Exports:
export default ReplyAction
