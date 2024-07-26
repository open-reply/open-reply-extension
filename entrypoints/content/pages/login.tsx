// Packages:
import React from 'react'

// Imports:
import { Mail } from 'lucide-react'

// Components:
import { Button } from '../components/ui/button'

// Functions:
const Login = () => {
  return (
    <div className='w-full h-full bg-white'>
      <Button size='lg'>
        <Mail className='mr-2 h-4 w-4' /> Login with Email
      </Button>
    </div>
  )
}

// Exports:
export default Login
