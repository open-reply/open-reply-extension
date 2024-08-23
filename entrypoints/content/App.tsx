// Packages:
import {
  MemoryRouter,
  Routes,
  Route,
} from 'react-router-dom'
import { cn } from './lib/utils'
import useUtility from './hooks/useUtility'

// Constants:
import ROUTES from './routes'

// Components:
import Index from './pages/index'
import Authentication from './pages/authentication'
import CTABubble from './components/secondary/CTABubble'
import { Toaster } from './components/ui/toaster'
import WebsiteFlagBanner from './components/secondary/WebsiteFlagBanner'

// Functions:
const App = () => {
  // Constants:
  const { isActive, setIsActive } = useUtility()

  // Ref:
  const containerRef = useRef<HTMLDivElement>(null)

  // Functions:
  const toggleApplicationVisibility = () => {
    if (isActive) {
      if (containerRef.current) containerRef.current.style.right = '0px'
    } else {
      const currentApplicationWidth = containerRef.current?.getBoundingClientRect().width
      if (containerRef.current) containerRef.current.style.right = `-${currentApplicationWidth}px`
    }
  }

  // Effects:
  useEffect(() => {
    toggleApplicationVisibility()
  }, [isActive])

  useEffect(() => {
    const resizeObserver = new ResizeObserver(toggleApplicationVisibility)
    resizeObserver.observe(document.body)

    return () => {
      resizeObserver.disconnect()
    }
  }, [toggleApplicationVisibility])

  // Return:
  return (
    <>
      <div
        ref={containerRef}
        id='container'
        style={{
          position: 'fixed',
          right: '-50vw',
          top: '0px',
          zIndex: '2147483647',
          transitionProperty: 'all',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDuration: '300ms',
        }}
      >
        <div
          className={cn(
            'absolute z-[-1] top-0 w-screen h-screen bg-zinc-900 transition-opacity duration-300',
            isActive ? 'opacity-80' : 'opacity-0'
          )}
          style={{
            transitionProperty: 'opacity',
            left: isActive ? '-100vw' : '0',
          }}
          onClick={() => setIsActive(false)}
        />
        <CTABubble />
        <div className='w-[50vw] max-w-[54rem] h-screen bg-white'>
          <MemoryRouter basename={ROUTES.INDEX}>
            <Routes>
              <Route path={ROUTES.INDEX} element={<Index />} />
              <Route path={ROUTES.AUTHENTICATION} element={<Authentication />} />
            </Routes>
          </MemoryRouter>
        </div>
        <Toaster />
      </div>
      <WebsiteFlagBanner />
    </>
  )
}

// Exports:
export default App
