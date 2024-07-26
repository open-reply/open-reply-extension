// Packages:
import { useContext } from 'react'

// Context:
import { UtilityContext } from '../context/UtilityContext'

// Functions:
const useUtility = () => {
  const context = useContext(UtilityContext)
  return context
}

// Exports:
export default useUtility
