// Packages:
import React, { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

// Typescript:
interface TabItem {
  title: React.ReactNode
  description: React.ReactNode
  quickView: React.ReactNode[]
}

// Imports:
import { SignOut } from '@phosphor-icons/react'

// Constants:
import ROUTES from '../../routes'

// Components:
import ProfileForm from './ProfileForm'
// import SafetyForm from './SafetyForm'
import ModerationForm from './ModerationForm'
// import AppearanceForm from './AppearanceForm'
import { Separator } from '../../components/ui/separator'
import { useToast } from '../../components/ui/use-toast'

// Functions:
// const SettingsFormBody = ({ selectedTab }: { selectedTab: number }) => {
//   switch (selectedTab) {
//     case 0:
//       return <ProfileForm />
//     case 1:
//       return <SafetyForm />
//     case 2:
//       return <ModerationForm />
//     case 3:
//       return <AppearanceForm />
//   }
// }

const SettingsFormBody = ({ selectedTab }: { selectedTab: number }) => {
  switch (selectedTab) {
    case 0:
      return <ProfileForm />
    case 1:
      return <ModerationForm />
  }
}

const Settings = () => {
  // Constants:
  const navigate = useNavigate()
  const location = useLocation()
  const { tabIndex } = location.state || {}
  const {
    isLoading: isAuthLoading,
    isAccountFullySetup,
    isSignedIn,
    handleLogout,
  } = useAuth()
  const { toast } = useToast()
  const tabItems = [
    {
      title: 'Profile',
      description: 'Manage how others see you.',
      quickView: ['Full Name', 'Username', 'Bio'],
    },
    // {
    //   title: 'Safety',
    //   description: 'Manage your safety on the internet.',
    //   quickView: ['Intelligent Warning', 'Safety Banner Position'],
    // },
    {
      title: 'Moderation',
      description: 'Manage your content moderation preferences.',
      quickView: ['Check Own Comment', 'Unsafe Content Policy'],
    },
    // {
    //   title: 'Appearance',
    //   description: 'Control the look and feel of OpenReply.',
    //   quickView: ['Theme', 'Visibility'],
    // },
  ] as TabItem[]

  // State:
  const [selectedTab, setSelectedTab] = useState(tabIndex ?? 0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Functions:
  const _handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const { status, payload } = await handleLogout()
      if (!status) throw payload

      toast({
        title: 'Logged out successfully!',
        description: 'Come back soon? :(',
      })
      navigate(ROUTES.AUTHENTICATION)
    } catch (error) {
      logError({
        functionName: 'Settings._handleLogout',
        data: null,
        error,
      })

      toast({
        title: 'Uh oh, something went wrong..',
        description: 'We were not able to sign you out.',
        variant: 'destructive',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Effects:
  // If signed in and hasn't setup their account, navigate them to account setup screen.
  useEffect(() => {
    if (
      !isAuthLoading &&
      isSignedIn &&
      !isAccountFullySetup
    ) navigate(ROUTES.SETUP_ACCOUNT)
  }, [isAuthLoading, isSignedIn, isAccountFullySetup])

  // Return:
  return (
    <main
      className='w-full pt-[68px] bg-white'
      style={{ height: 'calc(100% - 0px)' }}
    >
      <div className='flex h-full w-full'>
        <nav className='flex flex-col gap-2 w-1/3 h-full pt-5 px-3'>
          {tabItems.map((tab, index) => (
            <div
              className={cn(
                'data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:bg-overlay transition-all',
                'flex flex-col gap-1 justify-start w-full p-3 bg-[#ffffff] rounded-lg cursor-pointer transition-colors duration-200 hover:bg-overlay',
              )}
              onClick={() => setSelectedTab(index)}
              data-state={selectedTab === index ? 'active' : 'inactive'}
              key={index}
            >
              <span className='font-semibold text-base'>{tab.title}</span>
              <span className='font-normal text-xs text-brand-secondary'>
                {tab.description}
              </span>
              <span className='font-normal text-[0.6rem] text-brand-tertiary'>
                {tab.quickView.join(' • ')}
              </span>
            </div>
          ))}
          <div
            className='flex justify-start items-center gap-1.5 w-full p-3 bg-[#ffffff] rounded-lg cursor-pointer transition-colors duration-200 hover:bg-overlay'
            onClick={_handleLogout}
          >
            <SignOut size={16} weight='bold' />
            <span className='font-semibold text-base'>Logout</span>
          </div>
        </nav>
        <Separator orientation='vertical' />
        <div className='flex flex-col gap-3.5 w-2/3 pt-7 px-4'>
          <div className='flex flex-col'>
            <h1 className='text-2xl font-medium'>
              {tabItems[selectedTab].title}
            </h1>
            <h2 className='text-base font-regular text-brand-secondary'>
              {tabItems[selectedTab].description}
            </h2>
          </div>
          <SettingsFormBody selectedTab={selectedTab} />
        </div>
      </div>
    </main>
  )
}

// Exports:
export default Settings
