// Packages:
import { useContext } from 'react'

// Context:
import { NotificationsContext } from '../context/NotificationsContext'

// Functions:
const useNotifications = () => {
  const context = useContext(NotificationsContext)
  return context
}

// Exports:
export default useNotifications
