// Packages:
import { useNavigate } from 'react-router-dom'
import ROUTES from '../routes'

const Index = () => {
  // Constants:
  const navigate = useNavigate()

  // Effects:
  useEffect(() => {
    const isAuthenticated = false

    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN)
    }
  }, [navigate])

  // Return:
  return <></>
}

// Exports:
export default Index
