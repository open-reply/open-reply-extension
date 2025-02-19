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
import { getRDBWebsiteCommentCount, getRDBWebsiteSEO } from '../firebase/realtime-database/website/get'
import { getWebsiteVote } from '../firebase/realtime-database/votes/get'
import { downvoteWebsite, upvoteWebsite } from '../firebase/firestore-database/website/set'
import getStaticWebsiteFavicon from 'utils/getStaticWebsiteFavicon'
import { addComment } from '../firebase/firestore-database/comment/set'
import getURLHash from 'utils/getURLHash'
import { uid } from 'uid'

// Typescript:
import type { FirestoreDatabaseWebsite } from 'types/firestore.database'
import type { RealtimeDatabaseWebsite, RealtimeDatabaseWebsiteSEO } from 'types/realtime.database'
import { OrderBy, VoteType } from 'types/votes'
import { UnsafeContentPolicy } from 'types/user-preferences'
import type { URLHash } from 'types/websites'
import type { CommentID, Comment as CommentInterface } from 'types/comments-and-replies'

// Imports:
import { CircleHelpIcon } from 'lucide-react'
import LoadingIcon from '../components/primary/LoadingIcon'

// Constants:
import ROUTES from '../routes'

// Components:
import {
  DownvoteBubble,
  UpvoteBubble,
} from '../components/secondary/bubbles/VoteBubble'
// import FlagBubble from '../components/secondary/bubbles/FlagBubble'
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
import { DeepPartial } from 'react-hook-form'
import { Skeleton } from '../components/ui/skeleton'
import { ScrollArea } from '../components/ui/scroll-area'
import Comment from '../components/tertiary/Comment'
import ScrollEndObserver from '../components/secondary/ScrollEndObserver'

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
    isActive,
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
  const instanceID = useRef(uid())
  const reviewedCommentTextsSetRef = useRef<Map<string, string>>(new Map())
  const headerRef = useRef<HTMLDivElement>(null)

  // State:
  const [headerHeight, setHeaderHeight] = useState(300)
  const [isUserVoteFetched, setIsUserVoteFetched] = useState(false)
  const [userVote, setUserVote] = useState<VoteType>()
  const [isVoting, setIsVoting] = useState(false)
  const [isFetchingFirestoreWebsite, setIsFetchingFirestoreWebsite] = useState(true)
  const [firestoreWebsite, setFirestoreWebsite] = useState<DeepPartial<FirestoreDatabaseWebsite>>()
  const [realtimeDatabaseWebsiteSEO, setRealtimeDatabaseWebsiteSEO] = useState<RealtimeDatabaseWebsiteSEO>()
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
  const [isInitialLoadingOfCommentsComplete, setIsInitialLoadingOfCommentsComplete] = useState(false)
  const [isFetchingComments, setIsFetchingComments] = useState(false)
  const [lastVisibleCommentID, setLastVisibleCommentID] = useState<CommentID | null>(null)
  const [comments, setComments] = useState<CommentInterface[]>([])
  const [noMoreComments, setNoMoreComments] = useState(false)
  const [disableScrollEndObserver, setDisableScrollEndObserver] = useState(false)

  // Memo:
  const filteredComments = useMemo(() => {
    return comments.filter(comment =>
      !comment.isDeleted &&
      !comment.isRemoved &&
      !comment.isRestricted &&
      (
        unsafeContentPolicy === UnsafeContentPolicy.FilterUnsafeContent
        ? !comment.hateSpeech.isHateSpeech
        : true
      )
    )
  }, [
    comments,
    unsafeContentPolicy,
  ])

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

      const {
        status: getRDBWebsiteSEOStatus,
        payload: getRDBWebsiteSEOPayload,
      } = await getRDBWebsiteSEO(URLHash)
      if (!getRDBWebsiteSEOStatus) throw getRDBWebsiteSEOPayload

      if (getRDBWebsiteSEOPayload) setRealtimeDatabaseWebsiteSEO(getRDBWebsiteSEOPayload)
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

  const fetchComments = async (initialFetch?: boolean) => {
    try {
      if (isFetchingComments) return
      const _instanceID = instanceID.current
      if (!isInitialLoadingOfCommentsComplete) setIsInitialLoadingOfCommentsComplete(true)

      setIsFetchingComments(true)
      const { status, payload } = await getComments({
        lastVisibleID: lastVisibleCommentID,
        orderBy: orderCommentsBy,
        URLHash: currentURLHash!,
        resetPointer: initialFetch,
      })

      // If the user has navigated away, don't update the state.
      if (_instanceID !== instanceID.current) return

      if (!status) throw payload

      let _noMoreComments = false
      let _comments = payload.comments
      const _lastVisibleID = payload.lastVisibleID

      if (unsafeContentPolicy === UnsafeContentPolicy.FilterUnsafeContent) {
        _comments = _comments.filter(comment => comment.hateSpeech.isHateSpeech)
      }

      if (
        _lastVisibleID === null ||
        _comments.length === 0
      ) _noMoreComments = true

      setLastVisibleCommentID(_lastVisibleID)
      setComments(__comments => [...__comments, ..._comments])
      setNoMoreComments(_noMoreComments)
    } catch (error) {
      logError({
        functionName: 'Website.fetchComments',
        data: initialFetch,
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
      setFirestoreWebsite({
        ...firestoreWebsite,
        voteCount: {
          ...firestoreWebsite?.voteCount,
          up: userVote === VoteType.Upvote ? (firestoreWebsite?.voteCount?.up ?? 0) - 1 : (firestoreWebsite?.voteCount?.up ?? 0) + 1,
          down: userVote === VoteType.Downvote ? (firestoreWebsite?.voteCount?.down ?? 0) - 1 : (firestoreWebsite?.voteCount?.down ?? 0),
        },
      })

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
      setFirestoreWebsite({
        ...firestoreWebsite,
        voteCount: {
          ...firestoreWebsite?.voteCount,
          up: userVote === VoteType.Upvote ? (firestoreWebsite?.voteCount?.up ?? 0) - 1 : (firestoreWebsite?.voteCount?.up ?? 0),
          down: userVote === VoteType.Downvote ? (firestoreWebsite?.voteCount?.down ?? 0) - 1 : (firestoreWebsite?.voteCount?.down ?? 0) + 1,
        },
      })

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
      setIsAddingComment(true)
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
        URLHash: await getURLHash(currentURL),
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

  const scrollEndReached = async (isVisible: boolean) => {
    try {
      if (!isVisible || disableScrollEndObserver) return

      if (
        !noMoreComments &&
        !isFetchingComments
      ) {
        setDisableScrollEndObserver(true)
        await fetchComments()
      }
    } catch (error) {
      logError({
        functionName: 'Website.scrollEndReached',
        data: null,
        error,
      })
    } finally {
      setDisableScrollEndObserver(false)
    }
  }

  // Effects:
  // If signed in and hasn't setup their account, navigate them to account setup screen.
  useEffect(() => {
    if (
      isActive &&
      !isLoading &&
      isSignedIn &&
      !isAccountFullySetup
    ) navigate(ROUTES.SETUP_ACCOUNT)
  }, [
    isActive,
    isLoading,
    isSignedIn,
    isAccountFullySetup
  ])

  // Fetch the website.
  useEffect(() => {
    if (
      isActive &&
      !!currentURLHash
    ) fetchWebsite(currentURLHash)
  }, [
    isActive,
    currentURLHash
  ])

  // Fetch the initial set of comments on this website.
  useEffect(() => {
    if (
      isActive &&
      !!currentURLHash &&
      !isFetchingComments &&
      !noMoreComments &&
      !isInitialLoadingOfCommentsComplete
    ) fetchComments(true)
  }, [
    instanceID,
    isActive,
    currentURLHash,
    isFetchingComments,
    noMoreComments,
    unsafeContentPolicy,
    lastVisibleCommentID,
    orderCommentsBy,
  ])

  // Fetch the signed-in user's vote.
  useEffect(() => {
    if (
      isActive &&
      !isUserVoteFetched &&
      !isLoading &&
      isSignedIn &&
      user &&
      isWebsiteIndexed &&
      !!currentURLHash
    ) fetchUserVote(currentURLHash)
  }, [
    isActive,
    isUserVoteFetched,
    isLoading,
    isSignedIn,
    user,
    isWebsiteIndexed,
    currentURLHash,
  ])

  // Keep track of header height to calculate comments scrollbar height.
  useEffect(() => {
    const element = headerRef?.current
    if (!element) return

    const observer = new ResizeObserver(entries => {
      setHeaderHeight(entries[0].contentRect.height)
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

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
          isLoading={isFetchingFirestoreWebsite}
          count={firestoreWebsite?.voteCount?.up ?? 0}
          disabled={isVoting || isFetchingFirestoreWebsite}
          onClick={handleUpvote}
        />
        <DownvoteBubble
          isHighlighted={userVote === VoteType.Downvote}
          isLoading={isFetchingFirestoreWebsite}
          count={firestoreWebsite?.voteCount?.down ?? 0}
          disabled={isVoting || isFetchingFirestoreWebsite}
          onClick={handleDownvote}
        />
        {/* <FlagBubble onClick={() => {}} /> */}
      </div>
      <main className='w-full h-full pt-[68px] bg-white text-brand-primary'>
        <div
          ref={headerRef}
          className='flex flex-col w-full'
        >
          <div className='flex flex-col gap-2.5 w-full py-10 px-10 border-b-2 border-b-slate-200'>
            <div className='flex justify-start items-center flex-row gap-4'>
              {
                currentDomain && (
                  <div
                    className='w-8 aspect-square'
                    style={{
                      backgroundImage: currentDomain && `url(${ getStaticWebsiteFavicon(currentDomain) })`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )
              }
              <span className='font-semibold text-2xl text-black'>
                { truncate(title, { length: 80 }) }
              </span>
            </div>
            <small className='text-sm italic text-brand-secondary'>
              { truncate(realtimeDatabaseWebsiteSEO?.description ?? description, { length: 200 }) }
            </small>
          </div>
          <div className='flex flex-col gap-5 py-5 px-8'>
            <div className='flex justify-between items-center flex-row h-10'>
              <div className='flex items-center flex-row gap-2'>
                {
                  isFetchingFirestoreWebsite ? (
                    <>
                      <Skeleton className='w-10 h-6' />
                      <h5 className='font-semibold leading-5 text-xl text-black'>
                        {' '}comments
                      </h5>
                    </>
                  ) : (
                    <h5 className='font-semibold leading-5 text-xl text-black'>
                      { commentCount ?? 0 } comments
                    </h5>
                  )
                }
              </div>
              <div className='flex items-center flex-row gap-3.5'>
                <Select
                  defaultValue={OrderBy.Popular}
                  onValueChange={orderBy => {
                    if (filteredComments.length !== 0) {
                      setComments([])
                      setLastVisibleCommentID(null)
                      setOrderCommentsBy(orderBy as OrderBy)
                      setNoMoreComments(false)
                      fetchComments(true)
                    }
                  }}
                >
                  <SelectTrigger
                    className='w-[167px] font-medium'
                    disabled={isFetchingComments || filteredComments.length === 0}
                  >
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
                  <SelectTrigger
                    className='w-[204px] font-medium'
                    disabled={isFetchingComments || commentCount === 0}
                  >
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
                    disabled={isAddingComment}
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
                        size='sm'
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
                            className='flex flex-row gap-1.5 transition-all'
                            variant='destructive'
                            size='sm'
                            onClick={() => _addComment({ bypassOwnCommentCheck: true })}
                            disabled={isAddingComment || commentText.trim().length === 0}
                          >
                            {
                              isAddingComment ? (
                                <>
                                  <LoadingIcon className='w-4 h-4 text-white' />
                                  <span>Commenting..</span>
                                </>
                              ) : 'Comment Anyway'
                            }
                          </Button>
                        ) : (
                          <Button
                            className='flex flex-row gap-1.5 transition-all'
                            variant='default'
                            size='sm'
                            onClick={() => _addComment()}
                            disabled={isAddingComment || commentText.trim().length === 0}
                          >
                            {
                              isAddingComment ? (
                                <>
                                  <LoadingIcon className='w-4 h-4 text-white' />
                                  <span>Commenting..</span>
                                </>
                              ) : 'Comment'
                            }
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
        </div>
        {
          filteredComments.length > 0 ? (
            <ScrollArea
              className='w-full'
              style={{ height: `calc(100vh - ${ headerHeight }px)` }}
              hideScrollbar
            >
              <div className='flex flex-col gap-4 w-full px-4 pt-7 pb-16'>
                {
                  filteredComments.map(comment => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      updateCommentLocally={(comment: CommentInterface) => {
                        setComments(_comments => _comments.map(_comment => {
                          if (_comment.id === comment.id) return {
                            ..._comment,
                            ...comment,
                          }
                          else return _comment
                        }))
                      }}
                    />
                  ))
                }
              </div>
              <ScrollEndObserver
                setIsVisible={scrollEndReached}
                disabled={disableScrollEndObserver}
              />
            </ScrollArea>
          ) : (
            <div
              className='flex justify-center items-center flex-col gap-2 w-full select-none'
              style={{ height: `calc(100vh - ${ headerHeight }px)` }}
            >
              <h2 className='text-2xl font-bold'>No comments yet</h2>
              <p className='text-sm text-brand-secondary font-medium'>Say something to start the conversation!</p>
            </div>
          )
        }
      </main>
    </>
  )
}

// Exports:
export default Website
