
// Packages:
import { useState } from 'react'

// Typescript:
import { VoteCount } from 'types/votes'
interface VoteCountProps {
  voteCount: VoteCount
}

enum VoteStatus {
  UPVOTED = 'UPVOTED',
  DOWNVOTED = 'DOWNVOTED'
}

// Imports::
import { ArrowBigDown, ArrowBigUp, Ellipsis, Forward, MessageSquare } from 'lucide-react'

const CommentAction: React.FC<VoteCountProps> = ({ voteCount: { up = 0, down = 0 } }) => {

  const [voteCount, setVotecount] = useState(up - down)
  const [voteStatus, setVoteStatus] = useState<VoteStatus>()

  useEffect(() => {
    setVotecount(up - down)
  }, [up, down])

  // #TODO: Logic is incorrect need to fix this
  // Maybe take all the states into one single object state
  const upvoteComment = () => {
    if (voteStatus === VoteStatus.DOWNVOTED) {
      setVoteStatus(VoteStatus.UPVOTED)
      setVotecount(voteCount - 1)
      return
    }

    setVoteStatus(VoteStatus.UPVOTED)
    setVotecount(voteCount + 1)
  }
  const downvoteComment =  () => {
    if (voteStatus === VoteStatus.UPVOTED) {
      setVoteStatus(VoteStatus.DOWNVOTED)
      setVotecount(voteCount + 1)
      return
    }
    setVoteStatus(VoteStatus.DOWNVOTED)
    setVotecount(voteCount - 1)
  }

  return (
    <div className='flex space-x-6 items-center pt-1 -ml-[px]'>
      <div className='flex space-x-2 items-center'>
        <ArrowBigUp  size={18} fill='green'  color={'green'} onClick={upvoteComment} />
        <p className='text-[12px]'> { voteCount } </p>
        <ArrowBigDown size={18}  onClick={downvoteComment} />
      </div>
      <div className='flex space-x-2 items-center'>
        <MessageSquare size={14}/>
        <p className='text-[13px]'>Reply</p>
      </div>
      <div className='flex space-x-1 items-center'>
        <Forward size={18} />
        <p className='text-[13px]'>Share</p>
      </div>
      <div>
        <Ellipsis size={18} />
      </div>
    </div>
  )
}

// Exports:
export default CommentAction