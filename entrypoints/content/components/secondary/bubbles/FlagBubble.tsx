// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'

// Imports:
import { FlagIcon } from 'lucide-react'

// Functions:
const FlagBubble = ({
  onClick
}: {
  onClick: () => any
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
        'w-10 h-10 bg-white hover:bg-rose-500 active:bg-rose-600 text-black hover:text-white border-2 border-slate-200 hover:border-rose-800 rounded-full cursor-pointer transition-all duration-300',
        (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )
    }
      onClick={onClick}
    >
      <FlagIcon width={17} height={17} strokeWidth={1} />
    </div>
  )
}

// Exports:
export default FlagBubble
