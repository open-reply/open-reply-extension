// Packages:
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { cn } from './lib/utils'
import useUtility from './hooks/useUtility'
import useAuth from './hooks/useAuth'

// Constants:
import ROUTES from './routes'

// Components:
import Index from './pages/index'
import Authentication from './pages/authentication'
import CTABubble from './components/secondary/bubbles/CTABubble'
import { Toaster } from './components/ui/toaster'
import WebsiteFlagBanner from './components/secondary/WebsiteFlagBanner'
import Navbar from './components/secondary/Navbar'
import HomeBubble from './components/secondary/bubbles/HomeBubble'
import FeedbackBubble from './components/secondary/bubbles/FeedbackBubble'
import ProfileBubble from './components/secondary/bubbles/ProfileBubble'
import SettingsBubble from './components/secondary/bubbles/SettingsBubble'
import CommentsBubble from './components/secondary/bubbles/CommentsBubble'
import Website from './pages/website'
import Profile from './pages/profile'
import Settings from './pages/settings'
import Feed from './pages/feed'
import SetupAccount from './pages/setup-account'
import VerifyEmailBanner from './components/secondary/VerifyEmailBanner'
import NotificationsBubble from './components/secondary/bubbles/NotificationsBubble'

// Functions:
const App = () => {
  // Constants:
  const { shouldHide, isActive, setIsActive } = useUtility()
  const { isAccountFullySetup, isLoading, isSignedIn } = useAuth()

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
    !shouldHide && (
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
          <div id='app-container' className='relative w-[50vw] max-w-[54rem] h-screen bg-white'>
            <MemoryRouter basename={ROUTES.INDEX}>
              <Navbar />
              {!isLoading && isAccountFullySetup && isSignedIn && (
                <>
                  <HomeBubble />
                  <CommentsBubble />
                  <div className='absolute z-[1] bottom-4 -left-14 flex flex-col gap-4'>
                    <NotificationsBubble />
                    {/* <SavedBubble /> */}
                    <FeedbackBubble />
                    <ProfileBubble />
                    <SettingsBubble />
                  </div>
                  <VerifyEmailBanner />
                </>
              )}
              <Routes>
                <Route path={ROUTES.INDEX} element={<Index />} />
                <Route path={ROUTES.WEBSITE} element={<Website />} />
                <Route path={ROUTES.AUTHENTICATION} element={<Authentication />} />
                <Route path={ROUTES.FEED} element={<Feed />} />
                <Route path={ROUTES.SETUP_ACCOUNT} element={<SetupAccount />} />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                <Route path={ROUTES.USER} element={<Profile />} />
              </Routes>
            </MemoryRouter>
          </div>
          <Toaster />
        </div>
        <WebsiteFlagBanner />
      </>
    )
  )
}

// Exports:
export default App
