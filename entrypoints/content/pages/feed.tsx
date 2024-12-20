// Packages:
import useUserPreferences from '../hooks/useUserPreferences'

// Typescript:
import { UnsafeContentPolicy } from 'types/user-preferences'
import { Comment as CommentInterface } from 'types/comments-and-replies'

// Constants:
import { commentFixtures } from '@/fixtures/comment'

// Components:
import { ScrollArea } from '../components/ui/scroll-area'
import Comment from '../components/tertiary/Comment'

// Functions:
const Feed = () => {
  // Constants:
  const { moderation } = useUserPreferences()

  // Return:
  return (
    <main className='w-full pt-[68px] bg-white' style={{ height: 'calc(100% - 68px)' }}>
      <ScrollArea className='w-full h-screen' hideScrollbar>
        <div className='flex flex-col gap-4 w-full px-4 pt-7 pb-16'>
          {[...commentFixtures, ...commentFixtures]
            .filter(
              comment =>
                !comment.isDeleted &&
                !comment.isRemoved &&
                !comment.isRestricted &&
                (moderation.unsafeContentPolicy === UnsafeContentPolicy.FilterUnsafeContent
                  ? !comment.hateSpeech.isHateSpeech
                  : true)
            )
            .map(comment => (
              <Comment
                comment={comment}
                key={comment.id}
                updateCommentLocally={(comment: CommentInterface) => {
                  // setComments(_comments => _comments.map(_comment => {
                  //   if (_comment.id === comment.id) return {
                  //     ..._comment,
                  //     ...comment,
                  //   }
                  //   else return _comment
                  // }))
                }}
              />
            ))}
        </div>
      </ScrollArea>
    </main>
  )
}

// Exports:
export default Feed
