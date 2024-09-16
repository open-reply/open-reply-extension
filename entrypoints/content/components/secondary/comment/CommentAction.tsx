// Imports:
import { ArrowBigDown, ArrowBigUp, Ellipsis, Forward, MessageSquare } from 'lucide-react'
import React from 'react'
import { VoteCount } from 'types/votes'

interface VoteCountProps {
  voteCount: VoteCount
}

const CommentAction: React.FC<VoteCountProps> = ({ voteCount: { up, down } }) => {
  return (
    <div className='flex space-x-6 items-center pt-1 -ml-[px]'>
      <div className='flex space-x-2 items-center'>
        <ArrowBigUp  size={18} fill='#059669' color='#059669' />
        <p className='text-[12px]'> { up - down } </p>
        <ArrowBigDown size={18} />
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