// Packages:
import { useRef, useState, useEffect } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { useToast } from '../../components/ui/use-toast'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import isUsernameValid from 'utils/isUsernameValid'
import isFullNameValid from 'utils/isFullNameValid'
import { updateRDBUser } from '../../firebase/realtime-database/users/set'
import { getRDBUser, isUsernameTaken } from '../../firebase/realtime-database/users/get'
import { debounce, isEmpty, isEqual, omitBy, range, zipObject } from 'lodash'
import logError from 'utils/logError'

// Imports:
import { CircleCheckIcon, CircleXIcon, XIcon } from 'lucide-react'

// Components:
import { Button } from '../../components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form'
import { Input } from '../../components/ui/input'
import LoadingIcon from '../../components/primary/LoadingIcon'
import { Textarea } from '../../components/ui/textarea'

// Functions:
const ProfileForm = () => {
  // Constants:
  const { toast } = useToast()
  const {
    isSignedIn,
    isLoading,
    user,
  } = useAuth()
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
    bio: z.string()
      .min(1, 'Bio cannot be empty')
      .max(160, 'Bio cannot be longer than 160 characters')
      .regex(/^[\s\S]{1,160}$/, 'Bio must be between 1 and 160 characters')
      .refine(
        bio => (bio.match(/\n/g) || []).length <= 5,
        'Bio cannot contain more than 5 line breaks'
      )
      .refine(
        bio => !/\s{5,}/.test(bio),
        'Bio cannot contain 5 or more consecutive spaces'
      ),
    URLs: z.array(
      z.object({
        value: z.string().url('Please enter a valid URL'),
      }),
    )
      .max(5, 'No more than 5 URLs are allowed'),
  })

  // Ref:
  const usernameRef = useRef('')

  // State:
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false)
  const [defaultValues, setDefaultValues] = useState<z.infer<typeof schema>>({
    fullName: '',
    username: '',
    bio: '',
    URLs: [],
  })
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      username: '',
      bio: '',
      URLs: [],
    },
    mode: 'all',
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'URLs',
  })
  const username = form.watch('username')
  const [isCheckingUsernameUniqueness, setIsCheckingUsernameUniqueness] = useState(false)
  const [isUsernameUnique, setIsUsernameUnique] = useState<null | boolean>(null)

  // Functions:
  const loadUserProfile = async () => {
    try {
      if (isLoading) return
      setIsLoadingUserProfile(true)
      if (
        !isLoading &&
        (
          !isSignedIn ||
          !user
        )
      ) throw new Error('User is not signed in!')
      if (!user) throw new Error('User is not defined!')
      
      const {
        status: getRDBUserStatus,
        payload: getRDBUserPayload,
      } = await getRDBUser({ UID: user.uid })
      if (!getRDBUserStatus) throw getRDBUserPayload

      if (getRDBUserPayload?.fullName) form.setValue('fullName', getRDBUserPayload?.fullName)
      if (getRDBUserPayload?.username) form.setValue('username', getRDBUserPayload?.username)
      if (getRDBUserPayload?.bio) form.setValue('bio', getRDBUserPayload?.bio)
      setDefaultValues(_defaultValues => ({
        ..._defaultValues,
        fullName: getRDBUserPayload?.fullName ?? _defaultValues.fullName,
        username: getRDBUserPayload?.username ?? _defaultValues.username,
        bio: getRDBUserPayload?.bio ?? _defaultValues.bio,
        URLs: getRDBUserPayload?.URLs ? Object.values(getRDBUserPayload?.URLs).map(URL => ({ value: URL })) : _defaultValues.URLs,
      }))
    } catch (error) {
      logError({
        functionName: 'Settings.ProfileForm.loadUserProfile',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsLoadingUserProfile(false)
    }
  }

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
    try {
      setIsSubmittingDetails(true)
      let { username, fullName, bio, URLs } = values

      // Validate the username.
      if (!isUsernameValid(username)) {
        form.setError('username', { message: 'Please enter a valid username' })
        return
      }
      
      // Validate the full name.
      if (!isFullNameValid(fullName)) {
        form.setError('fullName', { message: 'Please enter a valid full name' })
        return
      }
      
      // Validate the bio.
      const {
        status: validateUserBioStatus,
        payload: validateUserBioPayload,
      } = validateUserBio(bio)
      if (!validateUserBioStatus) {
        form.setError('bio', { message: validateUserBioPayload[0] })
        return
      }

      // Validate the URL length.
      if (URLs.length > 5) {
        form.setError('URLs', { message: 'No more than 5 URLs are allowed' })
        return
      }

      // Validate each URL.
      let URLIndex = 0, isThereErrorInAnyURL = false
      for (const URL of URLs) {
        const parseResult = z.string().url('Please enter a valid URL').safeParse(URL.value)
        if (!parseResult.success) {
          form.setError(`URLs.${URLIndex}.value`, parseResult.error)
          isThereErrorInAnyURL = true
        }
        URLIndex++
      }
      if (isThereErrorInAnyURL) return

      const {
        status: updateRDBUserStatus,
        payload: updateRDBUserPayload,
      } = await updateRDBUser(omitBy({
        username: isEqual(defaultValues.username, username) ? undefined : username,
        fullName: isEqual(defaultValues.fullName, fullName) ? undefined : fullName,
        bio: isEqual(defaultValues.bio, bio) ? undefined : bio,
        URLs: isEqual(defaultValues.URLs, URLs) ? undefined : zipObject(range(URLs.length), URLs.map(URL => URL.value)),
      }, isEmpty))
      if (!updateRDBUserStatus) throw updateRDBUserPayload

      toast({
        title: 'Profile updated!',
        description: 'Your profile has been updated successfully!',
      })
    } catch (error) {
      logError({
        functionName: 'Settings.ProfileForm.onSubmit',
        data: null,
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

  // Effects:
  // Load the signed-in user's profile.
  useEffect(() => {
    loadUserProfile()
  }, [
    isLoading,
    isSignedIn,
    user,
  ])

  // Check username availability whenever the username is changed in the input.
  useEffect(() => onUsernameChange(username), [username])

  // Return:
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
          <FormField
            control={form.control}
            name='fullName'
            disabled={isLoadingUserProfile || isSubmittingDetails}
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-regular text-brand-secondary'>Full Name</FormLabel>
                <FormControl>
                  <Input
                    id='full-name'
                    type='text'
                    autoComplete='name'
                    placeholder='Full Name'
                    aria-describedby='full-name-error'
                    required
                    className='h-9 max-w-96'
                    inputClassName='px-2 py-1'
                    {...field}
                  />
                </FormControl>
                <div className='text-xs font-regular text-brand-secondary'>This is the name that will be displayed on your profile and in emails.</div>
                <FormMessage id='full-name-error' className='text-xs' />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='username'
            disabled={isLoadingUserProfile || isSubmittingDetails}
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-regular text-brand-secondary'>Username</FormLabel>
                <FormControl>
                  <Input
                    id='username'
                    type='text'
                    autoComplete='username'
                    placeholder='Username'
                    aria-describedby='username-error'
                    required
                    className='h-9 max-w-96'
                    inputClassName='px-3 py-1'
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
                <div className='text-xs font-regular text-brand-secondary'>This is your public username. You can only change this once every 30 days.</div>
                <FormMessage id='username-error' className='text-xs' />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='bio'
            disabled={isLoadingUserProfile || isSubmittingDetails}
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-regular text-brand-secondary'>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    id='bio'
                    autoComplete='off'
                    placeholder='Tell us a little bit about yourself'
                    aria-describedby='bio-error'
                    required
                    className='h-9 max-w-96 px-2 py-1 resize-none'
                    {...field}
                  />
                </FormControl>
                <div className='text-xs font-regular text-brand-secondary'>You can @mention other users and organizations to link to them.</div>
                <FormMessage id='bio-error' className='text-xs' />
              </FormItem>
            )}
          />
          <div className='flex flex-col gap-1'>
            <FormLabel className='text-sm font-regular text-brand-secondary'>URLs</FormLabel>
            <div className='text-xs font-regular text-brand-secondary'>Add links to your website, blog, or social media profiles.</div>
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`URLs.${index}.value`}
                render={({ field }) => (
                  <FormItem className='mt-1'>
                    <FormControl>
                      <div className='flex items-center space-x-2'>
                        <Input
                          id={`URLs.${index}.value`}
                          type='text'
                          autoComplete='off'
                          aria-describedby={`URLs.${index}.value-error`}
                          required
                          disabled={isLoadingUserProfile || isSubmittingDetails}
                          className='h-9 max-w-96'
                          inputClassName='px-3 py-1'
                          endAdornment={
                            <XIcon
                              className='h-4 w-4 cursor-pointer'
                              onClick={() => remove(index)}
                            />
                          }
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage id={`URLs.${index}.value-error`} className='text-xs' />
                  </FormItem>
                )}
              />
            ))}
            <FormMessage id='URLs-error' className='text-xs' />
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='w-fit h-8 mt-2 px-3 py-0 text-xs shadow-sm'
              onClick={() => append({ value: '' })}
              disabled={fields.length >= 5}
            >
              Add URL
            </Button>
          </div>
          <Button
            size='sm'
            type='submit'
            className='w-fit transition-all'
            disabled={!form.formState.isValid || isLoadingUserProfile || isSubmittingDetails}
            aria-label='Continue with email'
          >
            {
              isSubmittingDetails ? (
                <LoadingIcon className='h-4 w-4 text-white' aria-hidden='true' />
              ) : (
                <span>Update Profile</span>
              )
            }
          </Button>
        </form>
      </Form>
    </>
  )
}

// Exports:
export default ProfileForm
