// Packages:
import useUserPreferences from '../hooks/useUserPreferences'

// Typescript:
import { UnsafeContentPolicy } from 'types/user-preferences'

// Constants:
import { commentFixtures } from '@/fixtures/comment'

// Components:
import { ScrollArea } from '../components/ui/scroll-area'
import Comment from '../components/secondary/comment/Comment'

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
              <Comment comment={comment} key={comment.id} />
            ))}
        </div>
      </ScrollArea>
    </main>
  )
}

// Exports:
export default Feed
