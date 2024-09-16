
import { useState } from 'react'


// Components::
import { ArrowBigDown, ArrowBigUp, Ellipsis, Forward, MessageSquare } from 'lucide-react'

// Types:
import { VoteCount } from 'types/votes'

interface VoteCountProps {
  voteCount: VoteCount
}

const CommentAction: React.FC<VoteCountProps> = ({ voteCount: { up = 0, down = 0 } }) => {

  const [voteCount, setVotecount] = useState(up - down)
  const [isUpVoteActive, setUpVoteActive] = useState(true)
  const [isDownVoteActive, setDownVoteActive] = useState(false)

  useEffect(() => {
    setVotecount(up - down)
  }, [up, down])

  // #TODO: Logic is incorrect need to fix this
  // Maybe take all the states into one single object state
  const upVote = () => {
    if (isUpVoteActive) {
      setUpVoteActive(false)
      setVotecount(voteCount - 1)
      return
    }
    setUpVoteActive(true)
    setDownVoteActive(false)
    setVotecount(voteCount + 1)
  }
  const downVote =  () => {
    if (isDownVoteActive) {
      setDownVoteActive(false)
      setVotecount(voteCount + 1)
      return
    }
    setUpVoteActive(false)
    setDownVoteActive(true)
    setVotecount(voteCount - 1)
  }

  return (
    <div className='flex space-x-6 items-center pt-1 -ml-[px]'>
      <div className='flex space-x-2 items-center'>
        <ArrowBigUp  size={18} {...(isUpVoteActive && { fill: '#059669'  }) }  color={ isUpVoteActive ? '#059669' : 'currentColor'} onClick={upVote} />
        <p className='text-[12px]'> { voteCount } </p>
        <ArrowBigDown size={18} {...(isDownVoteActive && { fill: '#059669'  }) } color={ isDownVoteActive ? '#059669' : 'currentColor'} onClick={downVote} />
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