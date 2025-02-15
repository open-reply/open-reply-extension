// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

// Imports:
import { UserRoundIcon } from 'lucide-react'

// Constants:
import ROUTES from '@/entrypoints/content/routes'
import useAuth from '@/entrypoints/content/hooks/useAuth'

// Components:
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../ui/tooltip'

// Functions:
const ProfileBubble = () => {
  // Constants:
  const { isActive } = useUtility()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isSignedIn,
    isLoading,
    user,
  } = useAuth()

  // State:
  const [isLoaded, setIsLoaded] = useState(false)

  // Effects:
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Return:
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      >
        <div
          className={
            cn(
              'flex justify-center items-center',
              'w-10 h-10 bg-white hover:bg-zinc-300 text-black hover:text-zinc-700 border-2 border-slate-200 hover:border-none rounded-full cursor-pointer transition-all duration-300',
              location.pathname === ROUTES.PROFILE && 'bg-zinc-300 text-zinc-900 border-none hover:black cursor-auto pointer-events-none',
            )
          }
          onClick={() => navigate(ROUTES.PROFILE)}
        >
          {
            (
              !isLoading &&
              isSignedIn &&
              user?.photoURL
            ) ? (
              <Avatar
                className={cn(
                  'transition-all',
                  location.pathname === ROUTES.PROFILE ? 'w-9 h-9' : 'w-10 h-10',
                )}
              >
                <AvatarImage
                  src={user.photoURL}
                  alt={user.username}
                />
                <AvatarFallback>
                  <UserRoundIcon width={24} height={24} strokeWidth={1} />
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserRoundIcon width={24} height={24} strokeWidth={1} />
            )
          }
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <span className='text-xs'>Profile</span>
      </TooltipContent>
    </Tooltip>
  )
}

// Exports:
export default ProfileBubble
