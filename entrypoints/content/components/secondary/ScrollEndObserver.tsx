// Packages:
import { useRef, useState, useEffect } from 'react'

// Functions:
const ScrollEndObserver = ({
  setIsVisible,
  disabled,
}: {
  setIsVisible: (isVisible: boolean) => void
  disabled?: boolean
}) => {
  // Ref:
  const observerTarget = useRef(null)

  // State:
  const [isVisible, _setIsVisible] = useState(false)

  // Effects:
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        _setIsVisible(entries[0].isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px',
      }
    )

    if (observerTarget.current) observer.observe(observerTarget.current)

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!disabled) setIsVisible(isVisible)
  }, [
    disabled,
    setIsVisible,
    isVisible,
  ])
  
  // Return:
  return (
    <div
      className='w-full h-0.5 m-0 p-0'
      ref={observerTarget}
    />
  )
}

// Exports:
export default ScrollEndObserver
