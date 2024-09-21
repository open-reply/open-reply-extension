// Packages:
import { getPostedTimeDistanceFromNow } from '@/entrypoints/content/utils/timeHelpers'

// Components:
import { Avatar, AvatarFallback, AvatarImage } from '@/entrypoints/content/components/ui/avatar'
import CommentAction from './CommentAction'

// Typescript:
import type { Comment } from 'types/comments-and-replies'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { Timestamp } from 'firebase/firestore'

interface CommentProps {
  user: Partial<RealtimeDatabaseUser>,
  comment: Comment
}

// Functions:
const Comment = ({ user: { fullName, username }, comment }: CommentProps) => {

  // Return:
  return (
    <div className='flex m-4 space-x-4'>
      <div className='flex-none'>
        <Avatar>
          <AvatarImage src={'https://github.com/shadcn.png'} alt={username} />
          <AvatarFallback>{username}</AvatarFallback>
        </Avatar>
      </div>
      <div className='flex-initial'>
        <div className='flex flex-col space-y-1 text-sm'>
          <div className='flex items-center space-x-1.5 text-brand-tertiary'>
            <h1 className='font-semibold text-brand-primary cursor-pointer hover:underline'>{fullName}</h1>
            <p className='cursor-pointer hover:underline'>{username}</p>
            <p className='self-center'>·</p>
            <p>
              {
                comment.createdAt instanceof Timestamp ?
                getPostedTimeDistanceFromNow((comment.createdAt as Timestamp).toDate()) :
                '17h'
              }
            </p>
          </div>
          <div className='text-sm'>{comment.body}</div>
          <CommentAction voteCount={comment?.voteCount} />
        </div>
      </div>
    </div>
  )
}

// Exports:
export default Comment
