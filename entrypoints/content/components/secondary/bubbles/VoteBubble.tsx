// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'
import millify from 'millify'

// Typescript:
export interface VoteBubbleProps {
  isHighlighted?: boolean
  count: number
  onClick: () => any
}

// Imports:
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

// Functions:
const VoteBubble = ({
  isHighlighted,
  type,
  count,
  onClick,
}: VoteBubbleProps & {
  type: 'UPVOTE' | 'DOWNVOTE'
}) => {
  // Constants:
  const { isActive } = useUtility()

  // State:
  const [isLoaded, setIsLoaded] = useState(false)

  // Effects:
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Return:
  return (
    <div
    className={
      cn(
        'flex justify-center items-center',
        'w-10 h-10 bg-white hover:bg-zinc-300 text-black hover:text-zinc-700 border-2 border-slate-200 rounded-full cursor-pointer transition-all duration-300',
        (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        type === 'UPVOTE' ? 'flex-col active:text-white active:bg-emerald-700 active:border-emerald-800' : 'flex-col-reverse active:text-white active:bg-rose-700 active:border-rose-800',
        isHighlighted && (type === 'UPVOTE' ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700 hover:border-emerald-800 hover:text-white' : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-700 hover:border-rose-800 hover:text-white'),
      )
    }
      onClick={onClick}
    >
      {
        type === 'UPVOTE' ? (
          <ChevronUpIcon width={16} height={16} strokeWidth={2} className='mb-[-2px] mt-[-2px]' />
        ) : (
          <ChevronDownIcon width={16} height={16} strokeWidth={2} />
        )
      }
      <div
        className={cn(
          'font-medium leading-normal text-[10px] select-none',
          type === 'DOWNVOTE' && 'mb-[-4px] mt-[5px]'
        )}
      >
        { millify(count) }
      </div>
    </div>
  )
}

// Exports:
export const UpvoteBubble = (props: VoteBubbleProps) => <VoteBubble type='UPVOTE' {...props} />

export const DownvoteBubble = (props: VoteBubbleProps) => <VoteBubble type='DOWNVOTE' {...props} />
