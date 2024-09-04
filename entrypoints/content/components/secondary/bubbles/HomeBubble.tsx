// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

// Imports:
import IconLightTransparent from '~/assets/icon-light-transparent.png'
import IconDarkTransparent from '~/assets/icon-dark-transparent.png'

// Constants:
import ROUTES from '@/entrypoints/content/routes'

// Functions:
const HomeBubble = () => {
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
          'absolute z-[1] top-4 -left-14 w-10 h-10 bg-white hover:bg-zinc-300 border-2 border-slate-200 hover:border-none rounded-full cursor-pointer transition-all duration-300',
          (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          location.pathname === ROUTES.INDEX && 'bg-zinc-300 border-none hover:black cursor-auto pointer-events-none'
        )
      }
      style={{
        backgroundImage: `url(${IconLightTransparent})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={() => navigate(ROUTES.INDEX)}
    />
  )
}

// Exports:
export default HomeBubble
