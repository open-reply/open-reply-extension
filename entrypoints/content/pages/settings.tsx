// Packages:
import { useState, useEffect } from 'react'
import useUserPreferences from '../hooks/useUserPreferences'

// Components:
import { Separator } from '../components/ui/separator'
import { Switch } from '../components/ui/switch'
import { Slider } from '../components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

// Functions:
const Settings = () => {
  // Constants:
  const {
    isLoading,
    safety,
    setWebsiteWarningEnabled,
    setWebsiteWarningWarnAt,
    setWebsiteWarningPosition,
  } = useUserPreferences()
  
  // Return:
  return (
    <main className='w-full pt-16 bg-white' style={{ height: 'calc(100% - 68px)' }}>

    </main>
  )
}

// Exports:
export default Settings
