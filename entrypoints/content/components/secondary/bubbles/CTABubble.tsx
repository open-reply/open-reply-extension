// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'

// Imports:
import IconLightTransparent from '~/assets/icon-light-transparent.png'
import IconDarkTransparent from '~/assets/icon-dark-transparent.png'

// Functions:
const CTABubble = () => {
  // Constants:
  const { isActive, setIsActive } = useUtility()

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
          'absolute z-[1] bottom-12 -left-24 w-12 h-12 bg-white rounded-full shadow-sm shadow-slate-200 cursor-pointer hover:brightness-110 hover:shadow-md hover:shadow-slate-200 transition-all duration-300 border-2 border-slate-200 hover:border-slate-300',
          (isActive || !isLoaded) ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto',
        )
      }
      style={{
        backgroundImage: `url(${IconLightTransparent})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={() => setIsActive(true)}
    />
  )
}

// Exports:
export default CTABubble
