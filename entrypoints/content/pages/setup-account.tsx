// Packages:
import { useRef, useState, useEffect } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useToast } from '../components/ui/use-toast'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import isUsernameValid from 'utils/isUsernameValid'
import isFullNameValid from 'utils/isFullNameValid'
import { updateRDBUser } from '../firebase/realtime-database/users/set'
import { isUsernameTaken } from '../firebase/realtime-database/users/get'
import { debounce } from 'lodash'
import { cn } from '../lib/utils'
import logError from 'utils/logError'

// Imports:
import { CircleCheckIcon, CircleXIcon } from 'lucide-react'

// Constants:
import ROUTES from '../routes'

// Components:
import { Button } from '../components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form'
import { Input } from '../components/ui/input'
import LoadingIcon from '../components/primary/LoadingIcon'

// Functions:
const SetupAccount = () => {
  // Constants:
  const navigate = useNavigate()
  const { toast } = useToast()
  const schema = z.object({
    fullName: z.string()
      .min(2, 'Full name must contain at least 2 character(s)')
      .max(50, 'Full name cannot contain more than 50 character(s)')
      .regex(/^[\p{L}\s'-]+$/u, 'Full name can only contain valid Unicode letters, spaces, hyphens, and apostrophes')
      .regex(/^(?!.*\s{2,})/, 'Full name cannot contain consecutive spaces')
      .regex(/^(?![\s'-])(?!.*[\s'-]$)/, 'Full name cannot start or end with a space, hyphen, or apostrophe')
      .refine(fullName => !/[^a-zA-Z\s'-]/.test(fullName), 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    username: z.string()
      .min(1, 'Username cannot be empty')
      .max(30, 'Username cannot be longer than 30 characters')
      .regex(/^[a-z]/, 'Username must start with a lowercase letter')
      .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  })
  const {
    isLoading,
    isSignedIn,
    isAccountFullySetup,
    handleLogout,
  } = useAuth()

  // Ref:
  const usernameRef = useRef('')

  // State:
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      username: '',
    },
    mode: 'all',
  })
  const username = form.watch('username')
  const [isCheckingUsernameUniqueness, setIsCheckingUsernameUniqueness] = useState(false)
  const [isUsernameUnique, setIsUsernameUnique] = useState<null | boolean>(null)

  // Functions:
  const _isUsernameAlreadyInUse = async (username: string) => {
    try {
      if (usernameRef.current !== username) return
      const {
        status: isUsernameTakenStatus,
        payload: isUsernameTakenPayload,
      } = await isUsernameTaken(username)
      if (!isUsernameTakenStatus) throw isUsernameTakenPayload

      if (isUsernameTakenPayload) setIsUsernameUnique(false)
      else setIsUsernameUnique(true)
      setIsCheckingUsernameUniqueness(false)
    } catch (error) {
      logError({
        functionName: 'SetupAccount._isUsernameAlreadyInUse',
        data: username,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })

      setIsCheckingUsernameUniqueness(false)
    }
  }

  const isUsernameAlreadyInUse = debounce((username: string) => _isUsernameAlreadyInUse(username), 500)
  
  const onUsernameChange = (username: string) => {
    usernameRef.current = username

    if (isUsernameValid(username)) {
      setIsCheckingUsernameUniqueness(true)
      isUsernameAlreadyInUse(username)
    }
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const { fullName, username } = values

    if (!isUsernameValid(username)) {
      form.setError('username', { message: 'Please enter a valid username' })
      return
    } if (!isFullNameValid(fullName)) {
      form.setError('fullName', { message: 'Please enter a valid full name' })
      return
    }

    try {
      setIsSubmittingDetails(true)

      const {
        status: isUsernameTakenStatus,
        payload: isUsernameTakenPayload,
      } = await isUsernameTaken(username)
      if (!isUsernameTakenStatus) throw isUsernameTakenPayload

      if (isUsernameTakenPayload) {
        setIsCheckingUsernameUniqueness(false)
        setIsUsernameUnique(false)
        setIsSubmittingDetails(false)
        form.setError('username', { message: 'Username is already taken!' })
      }

      const {
        status: updateRDBUserStatus,
        payload: updateRDBUserPayload,
      } = await updateRDBUser({ fullName, username })
      if (!updateRDBUserStatus) throw updateRDBUserPayload
    } catch (error) {
      logError({
        functionName: 'SetupAccount.onSubmit',
        data: values,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsSubmittingDetails(false)
    }
  }

  const _handleLogout = async () => {
    try {
      const { status, payload } = await handleLogout()
      if (!status) throw payload

      toast({
        title: 'Logout successful!',
        description: "You've been successfully logged out, please login again.",
      })
    } catch (error) {
      logError({
        functionName: 'SetupAccount._handleLogout',
        data: username,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    }
  }

  // Effects:
  // If the user has already setup their account, redirect them to the /website screen.
  useEffect(() => {
    if (!isLoading) {
      if (isSignedIn) {
        if (isAccountFullySetup) navigate(ROUTES.WEBSITE)
      } else navigate(ROUTES.AUTHENTICATION)
    }
  }, [
    isLoading,
    isSignedIn,
    isAccountFullySetup,
    navigate,
  ])

  // Check username availability whenever the username is changed in the input.
  useEffect(() => onUsernameChange(username), [username])

  // Return:
  return (
    <main className='relative flex justify-center items-center w-full h-full bg-white text-brand-primary'>
      <div className='flex justify-center items-center flex-col w-[25.375rem]'>
        <h1 className='text-4xl font-semibold text-center'>Setup Your Account</h1>
        <p className='mt-2 text-sm font-medium text-brand-secondary text-center'>Please fill the details below to continue</p>
        <div className='flex flex-col w-96 mt-8'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <FormField
                control={form.control}
                name='fullName'
                disabled={isSubmittingDetails}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        id='full-name'
                        type='text'
                        autoComplete='name'
                        placeholder='Full Name'
                        aria-describedby='full-name-error'
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id='full-name-error' className='text-xs' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='username'
                disabled={isSubmittingDetails}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        id='username'
                        type='text'
                        autoComplete='username'
                        placeholder='Username'
                        aria-describedby='username-error'
                        required
                        endAdornment={
                          field.value.trim().length > 0 && (
                            <>
                              {
                                isCheckingUsernameUniqueness ? (
                                  <LoadingIcon className='h-4 w-4 text-brand-primary' aria-hidden='true' />
                                ) : isUsernameUnique ? (
                                  <CircleCheckIcon className='w-4 h-4 text-green' />
                                ) : (
                                  <CircleXIcon className='w-4 h-4 text-red' />
                                )
                              }
                            </>
                          )
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id='username-error' className='text-xs' />
                  </FormItem>
                )}
              />
              <Button
                size='lg'
                type='submit'
                className='w-full transition-all'
                disabled={!form.formState.isValid || isSubmittingDetails}
                aria-label='Continue with email'
              >
                {
                  isSubmittingDetails ? (
                    <LoadingIcon className='h-4 w-4 text-white' aria-hidden='true' />
                  ) : (
                    <span>Let's Go!</span>
                  )
                }
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <p
        className={
          cn(
            'absolute bottom-5 right-5 mt-2 text-sm font-medium text-placeholder text-center cursor-pointer hover:underline',
            isLoading && 'pointer-events-none'
          )
        }
        onClick={_handleLogout}
      >
        Log Out
      </p>
    </main>
  )
}

// Exports:
export default SetupAccount
