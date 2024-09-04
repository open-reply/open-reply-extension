// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

// Imports:
import { MessageSquareTextIcon } from 'lucide-react'

// Constants:
import ROUTES from '@/entrypoints/content/routes'

// Functions:
const CommentsBubble = () => {
  // Constants:
  const { isActive } = useUtility()
  const navigate = useNavigate()
  const location = useLocation()

  // State:
  const [isLoaded, setIsLoaded] = useState(false)

  // Effects:
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Return:
  return location.pathname !== ROUTES.WEBSITE && (
    <div
      className={
        cn(
          'flex justify-center items-center',
          'absolute z-[1] top-4 -left-14 w-10 h-10 bg-white hover:bg-zinc-300 text-black hover:text-zinc-700 border-2 border-slate-200 hover:border-none rounded-full cursor-pointer transition-all duration-300',
          (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          location.pathname === ROUTES.WEBSITE && 'bg-zinc-300 text-zinc-900 border-none hover:black cursor-auto pointer-events-none'
        )
      }
      onClick={() => navigate(ROUTES.WEBSITE)}
    >
      <MessageSquareTextIcon width={17} height={17} strokeWidth={1} />
    </div>
  )
}

// Exports:
export default CommentsBubble
