// Packages:
import useUtility from '../../hooks/useUtility'
import { cn } from '../../lib/utils'

// Functions:
const CTABubble = () => {
  // Constants:
  const { isActive, setIsActive } = useUtility()

  // Return:
  return (
    <div
      className={
        cn(
          'absolute z-[1] bottom-12 -left-24 w-12 h-12 bg-white rounded-full shadow-sm cursor-pointer hover:brightness-110 hover:shadow-md transition-all duration-300',
          isActive ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        )
      }
      onClick={() => setIsActive(true)}
    />
  )
}

// Exports:
export default CTABubble
