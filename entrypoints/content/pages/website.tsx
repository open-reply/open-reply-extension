// Packages:
import { useState, useRef } from 'react'
import useUtility from '../hooks/useUtility'
import { truncate } from 'lodash'
import useUserPreferences from '../hooks/useUserPreferences'
import { useToast } from '../components/ui/use-toast'
import { cn } from '../lib/utils'
import { checkCommentForHateSpeech, getComments } from '../firebase/firestore-database/comment/get'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { getFirestoreWebsite } from '../firebase/firestore-database/website/get'
import logError from 'utils/logError'
import { getRDBWebsiteCommentCount } from '../firebase/realtime-database/website/get'
import { getWebsiteVote } from '../firebase/realtime-database/votes/get'
import { downvoteWebsite, upvoteWebsite } from '../firebase/firestore-database/website/set'
import getStaticWebsiteFavicon from 'utils/getStaticWebsiteFavicon'
import { addComment } from '../firebase/firestore-database/comment/set'

// Typescript:
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { RealtimeDatabaseWebsite } from 'types/realtime.database'
import { OrderBy, VoteType } from 'types/votes'
import { UnsafeContentPolicy } from 'types/user-preferences'
import type { URLHash } from 'types/websites'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import type { Comment } from 'types/comments-and-replies'

// Imports:
import { CircleHelpIcon } from 'lucide-react'

// Constants:
import ROUTES from '../routes'

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../components/ui/hover-card'
import { Separator } from '../components/ui/separator'

// Functions:
const Website = () => {
  // Constants:
  const navigate = useNavigate()
  const {
    currentDomain,
    title,
    description,
    keywords,
    image,
    currentURL,
    currentURLHash,
  } = useUtility()
  const {
    moderation,
  } = useUserPreferences()
  const {
    isLoading,
    isSignedIn,
    user,
    isAccountFullySetup,
  } = useAuth()
  const { toast } = useToast()

  // Ref:
  const reviewedCommentTextsSetRef = useRef<Map<string, string>>(new Map())

  // State:
  const [isUserVoteFetched, setIsUserVoteFetched] = useState(false)
  const [userVote, setUserVote] = useState<VoteType>()
  const [isVoting, setIsVoting] = useState(false)
  const [isFetchingFirestoreWebsite, setIsFetchingFirestoreWebsite] = useState(true)
  const [firestoreWebsite, setFirestoreWebsite] = useState<FirestoreDatabaseWebsite>()
  const [isWebsiteIndexed, setIsWebsiteIndexed] = useState(false)
  const [commentCount, setCommentCount] = useState<RealtimeDatabaseWebsite['commentCount']>()
  const [orderCommentsBy, setOrderCommentsBy] = useState(OrderBy.Popular)
  const [unsafeContentPolicy, setUnsafeContentPolicy] = useState(moderation.unsafeContentPolicy)
  const [isCommentTextAreaEnabled, setIsCommentTextAreaEnabled] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isThereIssueWithComment, setIsThereIssueWithComment] = useState(false)
  const [issueWithCommentText, setIssueWithCommentText] = useState<string | null>(null)
  const [fixCommentSuggestion, setFixCommentSuggestion] = useState<string | null>(null)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [showCancelCommentAlertDialog, setShowCancelCommentAlertDialog] = useState(false)
  const [isFetchingComments, setIsFetchingComments] = useState(false)
  const [lastVisibleComment, setLastVisibleComment] = useState<QueryDocumentSnapshot<Comment, DocumentData> | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [noMoreComments, setNoMoreComments] = useState(false)

  // Functions:
  const fetchWebsite = async (URLHash: URLHash) => {
    try {
      setIsFetchingFirestoreWebsite(true)
      const {
        status: firestoreWebsiteSnapshotStatus,
        payload: firestoreWebsiteSnapshotPayload,
      } = await getFirestoreWebsite(URLHash)
      if (!firestoreWebsiteSnapshotStatus) throw firestoreWebsiteSnapshotPayload

      if (!firestoreWebsiteSnapshotPayload) return
      setIsWebsiteIndexed(true)
      setFirestoreWebsite(firestoreWebsiteSnapshotPayload)

      const {
        status: RDBWebsiteCommentCountStatus,
        payload: RDBWebsiteCommentCountPayload,
      } = await getRDBWebsiteCommentCount(URLHash)
      if (!RDBWebsiteCommentCountStatus) throw RDBWebsiteCommentCountPayload

      if (RDBWebsiteCommentCountPayload) setCommentCount(RDBWebsiteCommentCountPayload)
    } catch (error) {
      logError({
        functionName: 'Website.fetchWebsite',
        data: URLHash,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingFirestoreWebsite(false)
    }
  }

  const fetchComments = async ({
    lastVisible,
    orderBy,
    contentPolicy,
  }: {
    lastVisible: QueryDocumentSnapshot<Comment, DocumentData> | null
    orderBy: OrderBy
    contentPolicy: UnsafeContentPolicy
  }) => {
    try {
      setIsFetchingComments(true)
      const { status, payload } = await getComments({
        lastVisible,
        orderBy,
        URLHash: currentURLHash!,
      })
      if (!status) throw payload

      let _noMoreComments = false
      let _comments = payload.comments
      const _lastVisible = payload.lastVisible

      if (contentPolicy === UnsafeContentPolicy.FilterUnsafeContent) {
        _comments = _comments.filter(comment => comment.hateSpeech.isHateSpeech)
      }

      if (
        _lastVisible === null ||
        _comments.length === 0
      ) _noMoreComments = true

      setLastVisibleComment(_lastVisible)
      setComments(_comments)
      setNoMoreComments(_noMoreComments)
    } catch (error) {
      logError({
        functionName: 'Website.fetchComments',
        data: {
          lastVisible,
          orderBy,
          contentPolicy,
        },
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Could not fetch comments!',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingComments(false)
    }
  }

  const fetchUserVote = async (URLHash: URLHash) => {
    try {
      const {
        status: websiteVoteStatus,
        payload: websiteVotePayload,
      } = await getWebsiteVote({ URLHash })
  
      if (!websiteVoteStatus) throw websiteVotePayload
      if (websiteVotePayload) {
        setUserVote(websiteVotePayload.vote)
      }
    } catch (error) {
      logError({
        functionName: 'Website.fetchUserVote',
        data: URLHash,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsUserVoteFetched(true)
    }
  }

  const handleUpvote = async () => {
    const _oldWebsiteVote = userVote
    const oldVoteCount = firestoreWebsite?.voteCount
    try {
      if (
        !currentDomain ||
        !currentURL ||
        !currentURLHash
      ) return
      setIsVoting(true)

      if (userVote === VoteType.Upvote) setUserVote(undefined)
      else setUserVote(VoteType.Upvote)

      const { status, payload } = await upvoteWebsite({
        URL: currentURL,
        URLHash: currentURLHash,
        website: {
          title,
          description,
          keywords,
          image,
          favicon: getStaticWebsiteFavicon(currentDomain),
        },
      })

      if (!status) throw payload
      
      if (firestoreWebsite) setFirestoreWebsite({
        ...firestoreWebsite,
        voteCount: {
          ...firestoreWebsite.voteCount,
          up: userVote === VoteType.Upvote ? firestoreWebsite.voteCount.up - 1 : firestoreWebsite.voteCount.up + 1,
          down: userVote === VoteType.Downvote ? firestoreWebsite.voteCount.down - 1 : firestoreWebsite.voteCount.down,
        },
      })
    } catch (error) {
      setUserVote(_oldWebsiteVote)
      if (oldVoteCount) setFirestoreWebsite({
        ...firestoreWebsite,
        voteCount: oldVoteCount,
      })

      logError({
        functionName: 'Website.handleUpvote',
        data: undefined,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleDownvote = async () => {
    const _oldWebsiteVote = userVote
    const oldVoteCount = firestoreWebsite?.voteCount
    try {
      if (
        !currentDomain ||
        !currentURL ||
        !currentURLHash
      ) return
      setIsVoting(true)

      if (userVote === VoteType.Downvote) setUserVote(undefined)
      else setUserVote(VoteType.Downvote)

      const { status, payload } = await downvoteWebsite({
        URL: currentURL,
        URLHash: currentURLHash,
        website: {
          title,
          description,
          keywords,
          image,
          favicon: getStaticWebsiteFavicon(currentDomain),
        },
      })

      if (!status) throw payload

      if (firestoreWebsite) setFirestoreWebsite({
        ...firestoreWebsite,
        voteCount: {
          ...firestoreWebsite.voteCount,
          up: userVote === VoteType.Upvote ? firestoreWebsite.voteCount.up - 1 : firestoreWebsite.voteCount.up,
          down: userVote === VoteType.Downvote ? firestoreWebsite.voteCount.down - 1 : firestoreWebsite.voteCount.down + 1,
        },
      })
    } catch (error) {
      setUserVote(_oldWebsiteVote)
      if (oldVoteCount) setFirestoreWebsite({
        ...firestoreWebsite,
        voteCount: oldVoteCount,
      })

      logError({
        functionName: 'Website.handleDownvote',
        data: undefined,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const checkOwnCommentForOffensiveSpeech = async (commentText: string): Promise<boolean> => {
    const DEFAULT_COMMENT_TEXT_ISSUE = 'Offensive language detected. Please consider rephrasing the offensive language.'
    try {
      setIsThereIssueWithComment(false)
      setIssueWithCommentText(null)
      setFixCommentSuggestion(null)

      if (
        reviewedCommentTextsSetRef.current &&
        reviewedCommentTextsSetRef.current.has(commentText)
      ) {
        const reason = reviewedCommentTextsSetRef.current.get(commentText) ?? DEFAULT_COMMENT_TEXT_ISSUE
        setIsThereIssueWithComment(true)
        setIssueWithCommentText(reason)
        return true
      }

      const { status, payload } = await checkCommentForHateSpeech(commentText)
      // const status = true
      // const payload = {
      //   isHateSpeech: true,
      //   reason: 'The content includes a racial slur, which is considered hate speech.',
      //   suggestion: 'Remove the racial slur and any offensive language. Focus on discussing the challenges and efforts of the team in a respectful manner.',
      // }

      if (!status) throw payload
      if (payload.isHateSpeech) {
        const reason = payload.reason ?? DEFAULT_COMMENT_TEXT_ISSUE
        reviewedCommentTextsSetRef.current.set(commentText, reason)
        setIsThereIssueWithComment(true)
        setIssueWithCommentText(reason)
        if (payload.suggestion) setFixCommentSuggestion(payload.suggestion)

        return true
      }
      
      return false
    } catch (error) {
      logError({
        functionName: 'Website.checkOwnCommentForOffensiveSpeech',
        data: commentText,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'We could not check your comment for hate speech.',
        variant: 'destructive',
      })

      return false
    }
  }
  
  const _addComment = async (options?: {
    bypassOwnCommentCheck?: boolean
  }) => {
    try {
      if (commentText.trim().length === 0) throw new Error('Empty comment body!')
      if (
        !currentDomain ||
        !currentURL ||
        !currentURLHash
      ) throw new Error('Utility has not yet loaded!')

      if (moderation.checkOwnCommentForOffensiveSpeech && !options?.bypassOwnCommentCheck) {
        const containsOffensiveSpeech = await checkOwnCommentForOffensiveSpeech(commentText!)
        if (containsOffensiveSpeech) return
      }

      const { status, payload } = await addComment({
        body: commentText,
        domain: currentDomain,
        URL: currentURL,
        URLHash: currentURL,
        website: {
          title,
          description,
          keywords,
          image,
          favicon: getStaticWebsiteFavicon(currentDomain),
        }
      })
      if (!status) throw payload

      toast({
        title: 'Comment added!',
        description: 'Your comment has been posted.',
      })
      discardComment()
      setComments(_comments => [
        payload,
        ..._comments,
      ])
    } catch (error) {
      logError({
        functionName: 'Website._addComment',
        data: options,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'Your comment could not be posted.',
        variant: 'destructive',
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  const discardComment = () => {
    setIsCommentTextAreaEnabled(false)
    setCommentText('')
    setIsThereIssueWithComment(false)
    setIssueWithCommentText(null)
    setFixCommentSuggestion(null)
    setShowCancelCommentAlertDialog(false)
  }

  // Effects:
  // If signed in and hasn't setup their account, navigate them to account setup screen.
  useEffect(() => {
    if (
      !isLoading &&
      isSignedIn &&
      !isAccountFullySetup
    ) navigate(ROUTES.SETUP_ACCOUNT)
  }, [
    isLoading,
    isSignedIn,
    isAccountFullySetup
  ])

  // Fetch the website.
  useEffect(() => {
    if (!!currentURLHash) fetchWebsite(currentURLHash)
  }, [currentURLHash])

  // Fetch comments on this website.
  useEffect(() => {
    if (
      !!currentURLHash &&
      !isFetchingComments &&
      !noMoreComments
    ) fetchComments({
      contentPolicy: unsafeContentPolicy,
      lastVisible: lastVisibleComment,
      orderBy: orderCommentsBy,
    })
  }, [
    currentURLHash,
    isFetchingComments,
    noMoreComments,
    unsafeContentPolicy,
    lastVisibleComment,
    orderCommentsBy,
  ])

  // Fetch the signed-in user's vote.
  useEffect(() => {
    if (
      !isUserVoteFetched &&
      !isLoading &&
      isSignedIn &&
      user &&
      isWebsiteIndexed &&
      !!currentURLHash
    ) fetchUserVote(currentURLHash)
  }, [
    isUserVoteFetched,
    isLoading,
    isSignedIn,
    user,
    isWebsiteIndexed,
    currentURLHash,
  ])

  // Return:
  return (
    <>
      <AlertDialog open={showCancelCommentAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard comment?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to discard your comment? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelCommentAlertDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={discardComment}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className='absolute z-[1] top-[68px] -left-14 flex flex-col gap-3'>
        <UpvoteBubble
          isHighlighted={userVote === VoteType.Upvote}
          // TODO: Add skeleton for count (observe isFetchingFirestoreWebsite) and don't default to 0
          count={firestoreWebsite?.voteCount.up ?? 0}
          disabled={isVoting}
          onClick={handleUpvote}
        />
        <DownvoteBubble
          isHighlighted={userVote === VoteType.Downvote}
          // TODO: Add skeleton for count (observe isFetchingFirestoreWebsite) and don't default to 0
          count={firestoreWebsite?.voteCount.down ?? 0}
          disabled={isVoting}
          onClick={handleDownvote}
        />
        <FlagBubble onClick={() => {}} />
      </div>
      <main className='w-full pt-[68px] bg-white' style={{ height: 'calc(100% - 68px)' }}>
        <div className='flex flex-col gap-2.5 w-full py-10 px-10 border-b-2 border-b-slate-200'>
          <div className='flex justify-center items-center flex-row gap-4'>
            {
              currentDomain && (
                <div
                  className='w-14 h-14'
                  style={{
                    backgroundImage: currentDomain && `url(${ getStaticWebsiteFavicon(currentDomain) })`,
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
          <small className='mx-24 text-center text-sm italic text-zinc-600'>
            { truncate(firestoreWebsite?.description ?? description, { length: 200 }) }
          </small>
        </div>
        <div className='flex flex-col gap-5 py-5 px-8'>
          <div className='flex justify-between items-center flex-row h-10'>
            {/* TODO: Add skeleton for count (observe isFetchingFirestoreWebsite) and don't default to 0 */}
            <h5 className='font-semibold leading-5 text-xl text-black'>{ commentCount ?? 0 } comments</h5>
            <div className='flex items-center flex-row gap-3.5'>
              <Select
                defaultValue={OrderBy.Popular}
                onValueChange={orderBy => {
                  setOrderCommentsBy(orderBy as OrderBy)

                  // Whenever the user requests for comments in a different order, and there indeed
                  // are comments on that website, we set noMoreComments to false so as to let the fetchComments
                  // useEffect to run.
                  if (commentCount !== 0) setNoMoreComments(false)
                }}
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
                    isThereIssueWithComment && 'border-2 border-rose-600'
                  )}
                  placeholder='Share your thoughts'
                  value={commentText}
                  onChange={event => {
                    setCommentText(event.target.value)
                  }}
                />
                <div className='flex justify-between items-start w-full'>
                  <div className='flex items-center gap-[3px] font-medium text-sm text-rose-600'>
                    {
                      issueWithCommentText?.split(' ').map((word, index) => <span key={`issue-word-${ index }`}>{word}</span>)
                    }
                    {
                      isThereIssueWithComment && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <CircleHelpIcon
                              width={16}
                              height={16}
                              strokeWidth={2}
                              className='ml-1 cursor-pointer'
                            />
                          </HoverCardTrigger>
                          <HoverCardContent className='flex flex-col gap-2'>
                            <div className='font-bold text-lg'>Suggestions</div>
                            <Separator className='mb-1' />
                            <div>{ fixCommentSuggestion }</div>
                          </HoverCardContent>
                        </HoverCard>
                      )
                    }
                  </div>
                  <div className='flex justify-center items-center gap-2.5'>
                    <Button
                      className='transition-all'
                      variant='outline'
                      onClick={() => {
                        if (commentText.trim().length === 0) discardComment()
                        else setShowCancelCommentAlertDialog(true)
                      }}
                      disabled={isAddingComment}
                    >
                      Cancel
                    </Button>
                    {
                      isThereIssueWithComment ? (
                        <Button
                          className='transition-all'
                          variant='destructive'
                          onClick={() => _addComment({ bypassOwnCommentCheck: true })}
                          disabled={isAddingComment || commentText.trim().length === 0}
                        >
                          Comment Anyway
                        </Button>
                      ) : (
                        <Button
                          className='transition-all'
                          variant='default'
                          onClick={() => _addComment()}
                          disabled={isAddingComment || commentText.trim().length === 0}
                        >
                          Comment
                        </Button>
                      )
                    }
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
        {/* TODO: Comments will go here. */}
        {/* <ScrollArea></ScrollArea> */}
        <div></div>
      </main>
    </>
  )
}

// Exports:
export default Website
