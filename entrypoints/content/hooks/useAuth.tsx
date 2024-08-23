// Packages:
import { useContext } from 'react'

// Context:
import { AuthContext } from '../context/AuthContext'

// Functions:
const useAuth = () => {
  const context = useContext(AuthContext)
  return context
}

// Exports:
export default useAuth
