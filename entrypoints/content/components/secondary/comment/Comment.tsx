

// Components:
import { Avatar, AvatarFallback, AvatarImage } from '@/entrypoints/content/components/ui/avatar'
import CommentAction from './CommentAction'
import {  Comment } from 'types/comments-and-replies'

interface CommentProps {
    userInfo: {
        name: string,
        username: string,
        timePosted: string,
        profileImgUrl: string
    },
    comment: Comment
}

// Functions:
const Comment: React.FC<CommentProps> = ({ userInfo: { name, username, timePosted, profileImgUrl }, comment }) => {
  return (
      <div className="flex m-4 space-x-4">
        <div className="flex-none">
            <Avatar>
                <AvatarImage src={profileImgUrl} alt={username} />
                <AvatarFallback>{username}</AvatarFallback>
            </Avatar>
        </div>
        <div className="flex-initial">
          <div className='flex flex-col space-y-1 text-sm'>
            {/* user details and posted since time*/}
            <div className='flex items-center space-x-2'>
              <h1 className='font-semibold'>{name}</h1>
              <p>{username}</p>
              <p className='self-center'>•</p>
              <p>{timePosted}</p>
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
