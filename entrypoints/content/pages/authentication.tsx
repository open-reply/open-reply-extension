// Packages:
import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useToast } from '../components/ui/use-toast'
import {
  authenticateWithEmailAndPassword,
  authenticateWithGoogle,
} from '../firebase/auth'
import { getRDBUser } from '../firebase/realtime-database/users/get'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

// Typescript:
import type { UserCredential } from 'firebase/auth'
import { AUTH_MODE } from 'types/auth'

// Imports:
import GoogleIcon from '../icons/GoogleIcon'
import { Mail } from 'lucide-react'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'

// Constants:
import ROUTES from '../routes'

// Components:
import { Button } from '../components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form'
import { Input } from '../components/ui/input'
import LoadingIcon from '../components/primary/LoadingIcon'

// Functions:
const Login = () => {
  // Constants:
  const navigate = useNavigate()
  const { toast } = useToast()
  const schema = z.object({
    emailAddress: z.string()
      .min(2, 'Email address must contain at least 2 character(s)')
      .max(50, 'Email address cannot contain more than 50 character(s)')
      .email('Please enter a valid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .max(32, 'Password must not exceed 32 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  })
  const {
    isLoading,
    isSignedIn,
    isAccountFullySetup,
  } = useAuth()

  // State:
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      emailAddress: '',
      password: '',
    },
    mode: 'all',
  })
  const [isAuthenticationUnderway, setIsAuthenticationUnderway] = useState(false)
  const [isAuthenticationUnderwayWithGoogle, setIsAuthenticationUnderwayWithGoogle] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  // Functions:
  const onSuccessfulAuthentication = async (userCredential: UserCredential, mode?: AUTH_MODE) => {
    if (mode === AUTH_MODE.LOGIN) {
      toast({
        title: 'Logged in successfully!',
        description: 'Welcome to OpenReply.',
      })
    } else if (mode === AUTH_MODE.SIGN_UP) {
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to OpenReply.',
      })
    }

    // Loads the RDB user to the cache.
    await getRDBUser({ UID: userCredential.user.uid })
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const { emailAddress, password } = values

    try {
      setIsAuthenticationUnderway(true)
      const { payload: loginPayload, status: loginStatus } = await authenticateWithEmailAndPassword({
        emailAddress,
        password,
        mode: AUTH_MODE.LOGIN
      }, onSuccessfulAuthentication)

      if (loginStatus) return

      if (!loginStatus && loginPayload.toast) toast({
        ...loginPayload.toast,
        variant: 'destructive',
      })

      // NOTE: Login failed because user does not exist. Sign them up!
      if (!loginPayload.isSuccessful && !loginPayload.shouldRetry) {
        const { status: signUpStatus, payload: signUpPayload } = await authenticateWithEmailAndPassword({
          emailAddress,
          password,
          mode: AUTH_MODE.SIGN_UP
        }, onSuccessfulAuthentication)

        if (signUpStatus) return

        if (!signUpStatus && signUpPayload.toast) toast({
          ...signUpPayload.toast,
          variant: 'destructive',
        })
      }
    } catch (error) {
      logError({
        functionName: 'Authentication.onSubmit',
        data: values,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsAuthenticationUnderway(false)
    }
  }

  const continueWithGoogle = async () => {
    try {
      setIsAuthenticationUnderwayWithGoogle(true)
      const { status, payload } = await authenticateWithGoogle()
      if (!status) throw payload
    } catch (error) {
      logError({
        functionName: 'Authentication.continueWithGoogle',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsAuthenticationUnderwayWithGoogle(true)
    }
  }

  // Effects:
  useEffect(() => {
    if (!isLoading && isSignedIn) {
      if (isAccountFullySetup) navigate(ROUTES.WEBSITE)
      else navigate(ROUTES.SETUP_ACCOUNT)
    }
  }, [
    isLoading,
    isSignedIn,
    isAccountFullySetup,
    navigate,
  ])

  // Return:
  return (
    <main className='relative flex justify-center items-center w-full h-full bg-white text-brand-primary'>
      <div className='flex justify-center items-center flex-col w-[25.375rem]'>
        <h1 className='text-4xl font-semibold text-center'>Welcome to OpenReply</h1>
        <p className='mt-2 text-sm font-medium text-brand-secondary text-center'>Join the internet’s comment section</p>
        <div className='flex flex-col w-96 mt-8'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <FormField
                control={form.control}
                name='emailAddress'
                disabled={isAuthenticationUnderway || isAuthenticationUnderwayWithGoogle}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        id='email'
                        type='email'
                        autoComplete='email'
                        placeholder='name@example.com'
                        aria-describedby='email-error'
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id='email-error' className='text-xs' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                disabled={isAuthenticationUnderway || isAuthenticationUnderwayWithGoogle}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        id='password'
                        type={isPasswordVisible ? 'text' : 'password'}
                        placeholder={isPasswordVisible ? 'Jabberwock12' : '•••••••••'}
                        aria-describedby='password-error password-reset'
                        required
                        endAdornment={
                          <span
                            className='cursor-pointer'
                            onClick={() => setIsPasswordVisible(_isPasswordVisible => !_isPasswordVisible)}
                          >
                            {
                              isPasswordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />
                            }
                          </span>
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id='password-error' className='text-xs' />
                    <FormDescription
                      id='password-reset'
                      className='w-fit text-xs text-brand-secondary font-medium select-none cursor-pointer'
                    >
                      <button
                        className='hover:underline'
                        type='button'
                        onClick={() => window.open('https://openreply.app/reset-password', '_blank')}
                      >
                        Reset Password
                      </button>
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button
                size='lg'
                type='submit'
                className='w-full transition-all'
                disabled={!form.formState.isValid || isAuthenticationUnderway || isAuthenticationUnderwayWithGoogle}
                aria-label='Continue with email'
              >
                {
                  isAuthenticationUnderway ? (
                    <LoadingIcon className='mr-2 h-4 w-4 text-white' aria-hidden='true' />
                  ) : (
                    <Mail className='mr-2 h-4 w-4' aria-hidden='true' />
                  )
                }
                Continue With Email
              </Button>
            </form>
          </Form>
          <div className='flex flex-col space-y-5 mt-5'>
            <div className='relative select-none'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-border-primary' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-placeholder'>
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              size='lg'
              className='w-full'
              variant='outline'
              aria-label='Continue with Google'
              disabled={isAuthenticationUnderway || isAuthenticationUnderwayWithGoogle}
              onClick={continueWithGoogle}
            >
              {
                isAuthenticationUnderwayWithGoogle ? (
                  <LoadingIcon className='mr-2 h-4 w-4 text-white' aria-hidden='true' />
                ) : (
                  <GoogleIcon className='mr-2' />
                )
              }
              Continue With Google
            </Button>
            <div className='w-full'>
              <p className='text-center text-placeholder text-[10px] font-medium'>
                By clicking continue, you agree to our {' '}
                <a target='_blank' href='https://openreply.app/terms-of-service' className='font-bold hover:underline'>Terms of Service</a>, {' '}
                <a target='_blank' href='https://openreply.app/community-guidelines' className='font-bold hover:underline'>Community Guidelines</a>, and {' '}
                <a target='_blank' href='https://openreply.app/privacy-policy' className='font-bold hover:underline'>Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Exports:
export default Login
