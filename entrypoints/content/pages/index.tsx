// Packages:
import { useNavigate } from 'react-router-dom'

// Constants:
import ROUTES from '../routes'

const Index = () => {
  // Constants:
  const navigate = useNavigate()

  // Effects:
  useEffect(() => {
    const isAuthenticated = false

    if (!isAuthenticated) {
      navigate(ROUTES.AUTHENTICATION)
    }
  }, [navigate])

  // Return:
  return <></>
}

// Exports:
export default Index
