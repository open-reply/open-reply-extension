// Packages:
import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import useUserPreferences from '../../hooks/useUserPreferences'
import { useNavigate } from 'react-router-dom'
import { getRDBUser } from '../../firebase/realtime-database/users/get'
import { isEmpty } from 'lodash'
import prettyMilliseconds from 'pretty-ms'
import getPhotoURLFromUID from '../../utils/getPhotoURLFromUID'
import pastellify from 'pastellify'

// Typescript:
import type { UID } from 'types/user'
import type { URLHash } from 'types/websites'
import type { RealtimeDatabaseUser } from 'types/realtime.database'
import { UnsafeContentPolicy } from 'types/user-preferences'
import type { ContentHateSpeechResult } from 'types/comments-and-replies'
import { Timestamp, type FieldValue } from 'firebase/firestore'

// Constants:
import { SECOND } from 'time-constants'
import { TALKS_ABOUT_THRESHOLD } from 'constants/database/topics'

// Components:
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar'
import UserHoverCard from '../secondary/UserHoverCard'
import { Skeleton } from '../ui/skeleton'
import { Button } from '../ui/button'
import URLPreview from '../secondary/URLPreview'

// Functions:
const EmbeddedPost = ({
  UID,
  createdAt,
  body,
  URL,
  URLHash,
  hateSpeech,
}: {
  UID: UID
  createdAt: FieldValue
  body: string
  URL: string
  URLHash: URLHash
  hateSpeech: ContentHateSpeechResult
}) => {
  // Constants:
  const { moderation } = useUserPreferences()
  const navigate = useNavigate()
  const MAX_LINES = 5
  const MAX_CHARS = 350
  const shouldTruncate = body.split('\n').length > MAX_LINES || body.length > MAX_CHARS
  const truncatedText = shouldTruncate
    ? body.split('\n').slice(0, MAX_LINES).join('\n').slice(0, MAX_CHARS)
    : body
  const postAgeInMilliseconds = Math.round((createdAt as Timestamp).seconds * 10 ** 3)
  const ageOfPost = (Date.now() - postAgeInMilliseconds) > 30 * SECOND ?
    prettyMilliseconds(Date.now() - postAgeInMilliseconds, { compact: true }) :
    'now'

  // State:
  const [isFetchingAuthor, setIsFetchingAuthor] = useState(false)
  const [author, setAuthor] = useState<RealtimeDatabaseUser | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [blurUnsafeContent, setBlurUnsafeContent] = useState(
    moderation.unsafeContentPolicy === UnsafeContentPolicy.BlurUnsafeContent &&
    hateSpeech.isHateSpeech
  )

  // Functions:
  const fetchAuthor = async (UID: UID) => {
    try {
      setIsFetchingAuthor(true)
      const { status, payload } = await getRDBUser({ UID })
      if (!status) throw payload
      if (!isEmpty(payload) && !!payload) {
        setAuthor(payload)
        setIsFetchingAuthor(false)
      }
    } catch (error) {
      // NOTE: We're not showing an error toast here, since there'd be more than 1 comment, resulting in too many error toasts.
      logError({
        functionName: 'EmbeddedPost.fetchAuthor',
        data: null,
        error,
      })
    }
  }

  // Effects:
  // Fetches the author's details.
  useEffect(() => {
    fetchAuthor(UID)
  }, [UID])

  // Return:
  return (
    <div className='flex flex-row space-x-4 w-full !mt-2 p-3 rounded-lg border-[1px] border-border-primary'>
      <div className='flex-initial w-full'>
        <div className='flex flex-col space-y-1 text-sm'>
          <div className='flex items-center flex-row gap-1.5 text-brand-tertiary'>
            <Avatar className='w-5 h-5 mr-0.5 cursor-pointer' onClick={() => author?.username && navigate(`/u/${ author.username }`)}>
              <AvatarImage src={getPhotoURLFromUID(UID)} alt={author?.username} />
              <AvatarFallback
                className='text-[0.5rem] select-none'
                style={
                  UID ? {
                    backgroundColor: pastellify(UID, { toCSS: true })
                  } : {}
                }
              >
                { author?.fullName?.split(' ').map(name => name[0].toLocaleUpperCase()).slice(0, 2) }
              </AvatarFallback>
            </Avatar>
            <UserHoverCard
              isFetchingUser={isFetchingAuthor}
              UID={UID}
              fullName={author?.fullName}
              username={author?.username}
              bio={author?.bio}
              followingCount={author?.followingCount}
              followerCount={author?.followerCount}
              joinDate={author?.joinDate}
              talksAbout={(author?.commentCount ?? 0) > TALKS_ABOUT_THRESHOLD ? author?.talksAbout : undefined}
            >
              <h1 className='font-semibold text-brand-primary cursor-pointer hover:underline'>
                {
                  isFetchingAuthor ?
                  <Skeleton className='h-4 w-28' /> : (
                    <p
                      onClick={() => author?.username && navigate(`/u/${ author.username }`)}
                    >
                      {author?.fullName}
                    </p>
                  )
                }
              </h1>
            </UserHoverCard>
            {
              isFetchingAuthor ?
              <Skeleton className='h-4 w-16' /> : (
                <p className='cursor-pointer'
                  onClick={() => author?.username && navigate(`/u/${ author.username }`)}
                >
                  @{author?.username}
                </p>
              )
            }
            <p className='self-center'>·</p>
            <p className='cursor-pointer hover:underline'>{ageOfPost}</p>
          </div>
          <div className='relative text-sm'>
            <pre className='whitespace-pre-wrap font-sans'>
              {isExpanded ? body : truncatedText}
              {shouldTruncate && !isExpanded && '...'}
            </pre>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='font-semibold text-brand-secondary hover:underline'
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </button>
            )}
            {
              blurUnsafeContent && (
                <div
                  className={cn(
                    'absolute top-[-4px] left-[-8px] flex justify-center items-center w-[calc(100%+8px)] h-[calc(100%+8px)] transition-all',
                    blurUnsafeContent ? 'backdrop-blur-sm' : 'backdrop-blur-none',
                  )}
                >
                  <Button
                    size='sm'
                    onClick={() => setBlurUnsafeContent(false)}
                  >
                    Show unsafe comment
                  </Button>
                </div>
              )
            }
          </div>
          <div className='w-full pt-3.5'>
            <URLPreview
              URL={URL}
              URLHash={URLHash}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Exports:
export default EmbeddedPost
