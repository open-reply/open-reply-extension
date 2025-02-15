// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'
import useNotifications from '@/entrypoints/content/hooks/useNotifications'

// Imports:
import { BellIcon } from 'lucide-react'

// Constants:
import ROUTES from '@/entrypoints/content/routes'

// Functions:
const NotificationsBubble = () => {
  // Constants:
  const { isActive } = useUtility()
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadNotificationCount } = useNotifications()

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
          'relative flex justify-center items-center',
          'w-10 h-10 bg-white hover:bg-zinc-300 text-black hover:text-zinc-700 border-2 border-slate-200 hover:border-transparent rounded-full cursor-pointer transition-all duration-300',
          (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          location.pathname === ROUTES.NOTIFICATIONS && 'bg-zinc-300 text-zinc-900 border-transparent hover:black cursor-auto pointer-events-none'
        )
      }
      onClick={() => navigate(ROUTES.NOTIFICATIONS)}
    >
      {
        (unreadNotificationCount ?? 0) > 0 && (
          <div
            className={cn(
              'absolute flex justify-center items-center min-w-4 min-h-4 p-1 text-[0.6rem] leading-[0.5rem] text-white rounded-full bg-red',
              (unreadNotificationCount ?? 0) >= 10 ? '-top-1.5 -right-1.5' : '-top-1 -right-1',
            )}
          >
            {unreadNotificationCount ? unreadNotificationCount >= 10 ? '9+' : unreadNotificationCount : 0}
          </div>
        )
      }
      <BellIcon width={24} height={24} strokeWidth={1} />
    </div>
  )
}

// Exports:
export default NotificationsBubble
