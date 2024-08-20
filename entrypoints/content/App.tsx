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
import Login from './pages/login'
import CTABubble from './components/secondary/CTABubble'
import { Toaster } from './components/ui/toaster'

// Functions:
const App = ({
  container,
  shadow,
  shadowHost,
}: {
  container: HTMLElement
  shadow: ShadowRoot
  shadowHost: HTMLElement
}) => {
  // Constants:
  const { isActive, setIsActive } = useUtility()

  // Effects:
  const toggleApplicationVisibility = () => {
    if (isActive) {
      shadowHost.style.right = '0px'
    } else {
      const currentApplicationWidth = shadowHost.getBoundingClientRect().width
      shadowHost.style.right = `-${currentApplicationWidth}px`
    }
  }

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
            <Route path={ROUTES.LOGIN} element={<Login />} />
          </Routes>
        </MemoryRouter>
      </div>
      <Toaster />
    </>
  )
}

// Exports:
export default App
