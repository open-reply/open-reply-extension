// Packages:
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// Constants:
import ROUTES from '../routes'

const Index = () => {
  // Constants:
  const navigate = useNavigate()
  const {
    isLoading,
    isSignedIn,
    isAccountFullySetup,
  } = useAuth()

  // Effects:
  useEffect(() => {
    if (!isLoading) {
      if (isSignedIn) {
        if (isAccountFullySetup) navigate(ROUTES.WEBSITE)
        else navigate(ROUTES.SETUP_ACCOUNT)
      } else navigate(ROUTES.AUTHENTICATION)
    }
  }, [
    isLoading,
    isSignedIn,
    isAccountFullySetup,
    navigate,
  ])

  // Return:
  return <></>
}

// Exports:
export default Index
