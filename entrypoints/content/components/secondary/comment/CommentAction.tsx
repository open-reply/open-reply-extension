
// Packages:
import { useState } from 'react'

// Typescript:
import { VoteCount } from 'types/votes'
interface VoteCountProps {
  voteCount: VoteCount
}

// Imports::
import { ArrowBigDown, ArrowBigUp, Ellipsis, Forward, MessageSquare } from 'lucide-react'

const CommentAction: React.FC<VoteCountProps> = ({ voteCount: { up = 0, down = 0 } }) => {

  const [voteCount, setVotecount] = useState(up - down)
  const [isupvoteActive, setupvoteActive] = useState(true)
  const [isdownvoteActive, setdownvoteActive] = useState(false)

  useEffect(() => {
    setVotecount(up - down)
  }, [up, down])

  // #TODO: Logic is incorrect need to fix this
  // Maybe take all the states into one single object state
  const upVote = () => {
    if (isupvoteActive) {
      setupvoteActive(false)
      setVotecount(voteCount - 1)
      return
    }
    setupvoteActive(true)
    setdownvoteActive(false)
    setVotecount(voteCount + 1)
  }
  const downVote =  () => {
    if (isdownvoteActive) {
      setdownvoteActive(false)
      setVotecount(voteCount + 1)
      return
    }
    setupvoteActive(false)
    setdownvoteActive(true)
    setVotecount(voteCount - 1)
  }

  return (
    <div className='flex space-x-6 items-center pt-1 -ml-[px]'>
      <div className='flex space-x-2 items-center'>
        <ArrowBigUp  size={18} {...(isupvoteActive && { fill: '#059669'  }) }  color={ isupvoteActive ? '#059669' : 'currentColor'} onClick={upVote} />
        <p className='text-[12px]'> { voteCount } </p>
        <ArrowBigDown size={18} {...(isdownvoteActive && { fill: '#059669'  }) } color={ isdownvoteActive ? '#059669' : 'currentColor'} onClick={downVote} />
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