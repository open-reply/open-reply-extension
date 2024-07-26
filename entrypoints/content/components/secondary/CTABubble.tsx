// Packages:
import useUtility from '../../hooks/useUtility'
import localforage from 'localforage'
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
          'absolute z-[1] bottom-12 -left-24 w-12 h-12 bg-white rounded-full shadow-sm cursor-pointer hover:brightness-110 hover:shadow-md transition-all',
          isActive ? 'invisible' : 'visible'
        )
      }
      onClick={() => setIsActive(_isActive => !_isActive)}
    />
  )
}

// Exports:
export default CTABubble
