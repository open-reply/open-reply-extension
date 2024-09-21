// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

// Imports:
import { UserRoundIcon } from 'lucide-react'

// Constants:
import ROUTES from '@/entrypoints/content/routes'

// Functions:
const ProfileBubble = () => {
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
  return (
    <div
      className={
        cn(
          'flex justify-center items-center',
          'w-10 h-10 bg-white hover:bg-zinc-300 text-black hover:text-zinc-700 border-2 border-slate-200 hover:border-none rounded-full cursor-pointer transition-all duration-300',
          (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          location.pathname === ROUTES.PROFILE && 'bg-zinc-300 text-zinc-900 border-none hover:black cursor-auto pointer-events-none'
        )
      }
      onClick={() => navigate(ROUTES.PROFILE)}
    >
      <UserRoundIcon width={24} height={24} strokeWidth={1} />
    </div>
  )
}

// Exports:
export default ProfileBubble
