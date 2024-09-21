// Packages:
import { useState } from 'react'

// Typescript:
import { VoteCount } from 'types/votes'
interface VoteCountProps {
  voteCount: VoteCount
}

enum VoteStatus {
  UPVOTED = 'UPVOTED',
  DOWNVOTED = 'DOWNVOTED',
}

// Imports:
import {
  ArrowBigDown,
  ArrowBigUp,
  Ellipsis,
  Forward,
  MessageSquare,
} from 'lucide-react'

// Components:
import { Button } from '../../ui/button'
import { cn } from '@/entrypoints/content/lib/utils'

// Functions:
const CommentAction: React.FC<VoteCountProps> = ({ voteCount: { up, down } }) => {
  const [voteCount, setVoteCount] = useState(0)
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>()

  useEffect(() => {
    setVoteCount(up - down)
  }, [up, down])

  useEffect(() => {
    console.log(voteCount, voteStatus)
  }, [voteCount, voteStatus])

  // Maybe take all the states into one single object state
  const upvoteComment = () => {
    
    /**
     * if its already upvoted then turn off upvote and decrease vote count by 1
     */
    if (voteStatus === VoteStatus.UPVOTED) {
      setVoteStatus(null)
      setVoteCount(voteCount - 1)
      return
    }

    /**
     * if its downvoted then set votestatus to be upvoted and increase the votecount to be +2
     * to offset the votecount that was already decreased by 1 when it was downvoted
     */
    if (voteStatus === VoteStatus.DOWNVOTED) {
      setVoteStatus(VoteStatus.UPVOTED)
      setVoteCount(voteCount + 2)
      return
    }

    /**
     * if null: then simply increase the vote count and set votestatus to be upvoted
     */
    setVoteStatus(VoteStatus.UPVOTED)
    setVoteCount(voteCount + 1)
  }

  const downvoteComment = () => {
    // if its already downvoted then turn off downvote and increase votecount by 1
    if (voteStatus === VoteStatus.DOWNVOTED) {
      setVoteStatus(null)
      setVoteCount(voteCount + 1)
      return
    }

    /** 
     * if its already upvoted then set it to be downvoted and decrease votecount by 2 to offset 
     * the votecount that was already increased by 1 when it was upvoted
     * */ 
    if (voteStatus === VoteStatus.UPVOTED) {
      setVoteStatus(VoteStatus.DOWNVOTED)
      setVoteCount(voteCount - 2)
      return
    }

    /** 
     * if nothing simply set votestatus to be downvoted and decrease votecount by 1
     * */ 
    setVoteStatus(VoteStatus.DOWNVOTED)
    setVoteCount(voteCount - 1)
  }

  const isUpvoted = useMemo(
    () => voteStatus === VoteStatus.UPVOTED,
    [voteStatus]
  )

  const isDownvoted = useMemo(
    () => voteStatus === VoteStatus.DOWNVOTED,
    [voteStatus]
  )

  return (
    <div className='flex space-x-1 items-center -mt-2 text-brand-primary'>
      <div className='flex space-x-1 items-center -ml-2 mr-1'>
        <Button
          variant='ghost'
          size='icon'
          className='w-7 h-7 rounded-full'
        >
          <ArrowBigUp
            size={18}
            strokeWidth={1.5}
            className={cn(isUpvoted ? 'text-green fill-green' : 'border-brand-primary')}
            onClick={upvoteComment}
          />
        </Button>
        <p className='text-xs font-medium'>{voteCount}</p>
        <Button
          variant='ghost'
          size='icon'
          className='w-7 h-7 rounded-full'
        >
          <ArrowBigDown
            size={18}
            strokeWidth={1.5}
            className={cn(isUpvoted ? 'text-red fill-red' : 'border-brand-primary')}
            onClick={downvoteComment}
          />
        </Button>
      </div>
      <Button variant='ghost' size='sm' className='flex space-x-1 items-center h-6 px-2 py-2 rounded-lg'>
        <MessageSquare size={14} strokeWidth={1.75} />
        <p className='text-xs'>Reply</p>
      </Button>
      <Button variant='ghost' size='sm' className='flex space-x-1 items-center h-6 px-2 py-2 rounded-lg'>
        <Forward size={18} strokeWidth={1} />
        <p className='text-xs'>Share</p>
      </Button>
      <Button variant='ghost' size='icon' className='flex justify-center items-center w-7 h-6 rounded-lg'>
        <Ellipsis size={18} strokeWidth={1} className='fill-brand-primary' />
      </Button>
    </div>
  )
}

// Exports:
export default CommentAction
