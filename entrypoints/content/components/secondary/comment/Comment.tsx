// Packages:
import { getPostedTimeDistanceFromNow } from '@/entrypoints/content/utils/timeHelpers'

// Components:
import { Avatar, AvatarFallback, AvatarImage } from '@/entrypoints/content/components/ui/avatar'
import CommentAction from './CommentAction'

// Typescript:
import {  Comment } from 'types/comments-and-replies'
import { RealtimeDatabaseUser } from 'types/realtime.database.ts'
export interface CommentProps {
  user: Partial<RealtimeDatabaseUser>,
  comment: Comment
}

// Functions:
const Comment: React.FC<CommentProps> = ({ user: { fullName, username }, comment }) => {
  return (
      <div className="flex m-4 space-x-4">
        <div className="flex-none">
            <Avatar>
                <AvatarImage src={"https://github.com/shadcn.png"} alt={username} />
                <AvatarFallback>{username}</AvatarFallback>
            </Avatar>
        </div>
        <div className="flex-initial">
          <div className='flex flex-col space-y-1 text-sm'>
            <div className='flex items-center space-x-2'>
              <h1 className='font-semibold'>{fullName}</h1>
              <p>{username}</p>
              <p className='self-center'>•</p>
              <p>{getPostedTimeDistanceFromNow(comment.createdAt as unknown as Date)}</p>
            </div>
            <div>
              <p className='text-sm'>{comment.body}</p>
            </div>
            <CommentAction voteCount={comment?.voteCount} />
          </div>
        </div>
      </div>
  )
}

// Exports:
export default Comment