// Packages:
import { useContext } from 'react'

// Context:
import { UserPreferencesContext } from '../context/UserPreferences'

// Functions:
const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext)
  return context
}

// Exports:
export default useUserPreferences
