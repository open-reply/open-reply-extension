// Packages:
import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import useUserPreferences from '../../hooks/useUserPreferences'
import useAuth from '../../hooks/useAuth'

// Constants:
import ROUTES from '../../routes'

// Components:
import SafetyForm from './SafetyForm'
import ModerationForm from './ModerationForm'
import AppearanceForm from './AppearanceForm'
import { Separator } from '../../components/ui/separator'

// Functions:
const SettingsFormBody = ({ selectedTab }: { selectedTab: number }) => {
  switch (selectedTab) {
    case 0:
      return <SafetyForm />
    case 1:
      return <ModerationForm />
    case 2:
      return <AppearanceForm />
  }
}

const Settings = () => {
  // Constants:
  const navigate = useNavigate()
  const { loadUserPreferences } = useUserPreferences()
  const {
    isLoading: isAuthLoading,
    isAccountFullySetup,
    isSignedIn,
  } = useAuth()
  const tabItems = [
    {
      title: 'Safety',
      description: 'Manage your safety on the internet.',
      quickView: ['Intelligent Warning', 'Safety Banner Position'],
    },
    {
      title: 'Moderation',
      description: 'Manage your content moderation preferences.',
      quickView: ['Check Own Comment', 'Unsafe Content Policy'],
    },
    {
      title: 'Appearance',
      description: 'Control the look and feel of OpenReply.',
      quickView: ['Theme', 'Visibility'],
    },
  ]

  // State:
  const [selectedTab, setSelectedTab] = useState(0)

  // Effects:
  // If signed in and hasn't setup their account, navigate them to accoutn setup screen.
  useEffect(() => {
    if (!isAuthLoading && isSignedIn && isAccountFullySetup)
      navigate(ROUTES.SETUP_ACCOUNT)
  }, [isAuthLoading, isSignedIn, isAccountFullySetup])

  // Load the current user's preferences.
  useEffect(() => {
    if (!isAuthLoading && isAccountFullySetup && isSignedIn)
      loadUserPreferences()
  }, [isAuthLoading, isAccountFullySetup, isSignedIn])

  // Return:
  return (
    <main
      className='w-full pt-16 bg-white'
      style={{ height: 'calc(100% - 68px)' }}
    >
      <div className='h-full w-full flex flex-row'>
        <nav className='w-1/3 h-full flex flex-col pt-5 px-3 gap-2'>
          {tabItems.map((tab, index) => (
            <div
              className={cn(
                'data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:bg-overlay transition-all',
                'w-full p-3 flex flex-col gap-1 justify-start cursor-pointer bg-[#ffffff] hover:bg-overlay transition-colors duration-200 rounded-lg'
              )}
              onClick={() => {
                setSelectedTab(index)
              }}
              data-state={selectedTab === index ? 'active' : 'inactive'}
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
        </nav>
        <Separator orientation='vertical' />
        <div className='w-2/3 flex flex-col pt-7 px-4 gap-3.5'>
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
