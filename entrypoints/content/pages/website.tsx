// Packages:
import useUtility from '../hooks/useUtility'
import { truncate } from 'lodash'
import useUserPreferences from '../hooks/useUserPreferences'
import { useToast } from '../components/ui/use-toast'

// Typescript:
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { RealtimeDatabaseWebsite } from 'types/realtime.database'
import { OrderBy } from 'types/votes'
import { UnsafeContentPolicy } from 'types/user-preferences'

// Components:
import {
  DownvoteBubble,
  UpvoteBubble,
} from '../components/secondary/bubbles/VoteBubble'
import FlagBubble from '../components/secondary/bubbles/FlagBubble'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'

// Functions:
const Website = () => {
  // Constants:
  const {
    currentDomain,
    title,
    description,
  } = useUtility()
  const {
    moderation,
  } = useUserPreferences()
  const { toast } = useToast()

  // State:
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [isDownvoted, setIsDownvoted] = useState(false)
  const [firestoreWebsite, setFirestoreWebsite] = useState<FirestoreDatabaseWebsite>()
  const [realtimeWebsite, setRealtimeWebsite] = useState<RealtimeDatabaseWebsite>()
  const [orderCommentsBy, setOrderCommentsBy] = useState(OrderBy.Popular)
  const [unsafeContentPolicy, setUnsafeContentPolicy] = useState(moderation.unsafeContentPolicy)
  const [isCommentTextAreaEnabled, setIsCommentTextAreaEnabled] = useState(false)
  const [commentText, setCommentText] = useState<string>()
  const [issueWithCommentText, setIssueWithCommentText] = useState<string | null>()
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Functions:
  // TODO: Check for lodash debounce implementation.
  const _checkOwnCommentForOffensiveSpeech = async () => {
    try {
      // setIssueWithCommentText(null)
    } catch (error) {

    }
  }

  const checkOwnCommentForOffensiveSpeech = async () => {

  }

  const addComment = async () => {
    try {

    } catch (error) {
      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Your comment could not be posted.',
        variant: 'destructive',
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  // Effects:
  useEffect(() => {
    checkOwnCommentForOffensiveSpeech()
  }, [commentText])

  // Return:
  return (
    <>
      <div className='absolute z-[1] top-[68px] -left-14 flex flex-col gap-3'>
        <UpvoteBubble
          isHighlighted={isUpvoted}
          count={1655}
          onClick={() => {
            if (isDownvoted) setIsDownvoted(false)
            setIsUpvoted(_isUpvoted => !_isUpvoted)
          }}
        />
        <DownvoteBubble
          isHighlighted={isDownvoted}
          count={20}
          onClick={() => {
            if (isUpvoted) setIsUpvoted(false)
            setIsDownvoted(_isDownvoted => !_isDownvoted)
          }}
        />
        <FlagBubble onClick={() => {}} />
      </div>
      <main className='w-full pt-16 bg-white' style={{ height: 'calc(100% - 68px)' }}>
        <div className='flex flex-col gap-2.5 w-full py-10 px-10 border-b-2 border-b-slate-200'>
          <div className='flex justify-center items-center flex-row gap-4'>
            {
              currentDomain && (
                <div
                  className='w-14 h-14'
                  style={{
                    backgroundImage: `url(https://www.google.com/s2/favicons?sz=64&domain_url=${ currentDomain })`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )
            }
            <h1 className='text-center font-semibold text-4xl text-black'>
              { truncate(title, { length: 30 }) }
            </h1>
          </div>
          <small className='mx-24 text-center text-sm italic text-zinc-600'>{ truncate(description, { length: 200 }) }</small>
        </div>
        <div className='flex flex-col gap-5 py-5 px-8'>
          <div className='flex justify-between items-center flex-row h-10'>
            <h5 className='font-semibold leading-5 text-xl text-black'>{ realtimeWebsite?.commentCount ?? 0 } comments</h5>
            <div className='flex items-center flex-row gap-3.5'>
              <Select
                defaultValue={OrderBy.Popular}
                onValueChange={orderBy => setOrderCommentsBy(orderBy as OrderBy)}
              >
                <SelectTrigger className='w-[167px] font-medium'>
                  <SelectValue placeholder='Sort Comments' />
                </SelectTrigger>
                <SelectContent className='font-medium'>
                  <SelectItem value={OrderBy.Popular}>Popular</SelectItem>
                  <SelectItem value={OrderBy.Controversial}>Controversial</SelectItem>
                  <SelectItem value={OrderBy.Newest}>Newest</SelectItem>
                  <SelectItem value={OrderBy.Oldest}>Oldest</SelectItem>
                </SelectContent>
              </Select>
              <Select
                defaultValue={moderation.unsafeContentPolicy}
                onValueChange={unsafeContentPolicy => setUnsafeContentPolicy(unsafeContentPolicy as UnsafeContentPolicy)}
              >
                <SelectTrigger className='w-[204px] font-medium'>
                  <SelectValue placeholder='Moderation' />
                </SelectTrigger>
                <SelectContent className='font-medium'>
                  <SelectItem value={UnsafeContentPolicy.BlurUnsafeContent}>Blur Unsafe Content</SelectItem>
                  <SelectItem value={UnsafeContentPolicy.ShowAll}>Show All</SelectItem>
                  <SelectItem value={UnsafeContentPolicy.FilterUnsafeContent}>Filter Unsafe Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {
            isCommentTextAreaEnabled ? (
              <div className='flex flex-col gap-2.5 w-full'>
                <Textarea
                  className={cn(
                    'resize-none',
                    issueWithCommentText && 'border-2 border-rose-600'
                  )}
                  placeholder='Share your thoughts'
                  value={commentText}
                  onChange={event => setCommentText(event.target.value)}
                />
                <div className='flex justify-between items-start w-full'>
                  <div className='font-medium text-xs text-rose-600'>{ issueWithCommentText }</div>
                  <div className='flex justify-center items-center gap-4'>
                    <Button
                      variant='outline'
                      onClick={() => setIsCommentTextAreaEnabled(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={issueWithCommentText ? 'destructive' : 'default'}
                      onClick={addComment}
                    >
                      {
                        issueWithCommentText ? 'Comment Anyway' : 'Comment'
                      }
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className='w-full h-6 pb-1 text-sm text-muted-foreground border-b-2 border-b-zinc-300 cursor-pointer select-none'
                onClick={() => setIsCommentTextAreaEnabled(true)}
              >
                Share your thoughts
              </div>
            )
          }
        </div>
        
        {/* <ScrollArea></ScrollArea> */}
        <div></div>
      </main>
    </>
  )
}

// Exports:
export default Website
