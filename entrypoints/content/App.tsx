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
  const { isActive } = useUtility()

  // Effects:
  useEffect(() => {
    if (isActive) {
      shadowHost.style.right = '0px'
    } else {
      const currentApplicationWidth = shadowHost.getBoundingClientRect().width
      shadowHost.style.right = `-${currentApplicationWidth}px`
    }
  }, [isActive])

  // Return:
  return (
    <>
      <div className='absolute z-[0] bg-gray-900 -left-[100vw] top-0 w-screen h-screen' />
      <CTABubble />
      <div className='w-[50vw] max-w-[54rem] h-screen bg-white'>
        <MemoryRouter basename={ROUTES.INDEX}>
          <Routes>
            <Route path={ROUTES.INDEX} element={<Index />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
          </Routes>
        </MemoryRouter>
      </div>
    </>
  )
}

// Exports:
export default App
