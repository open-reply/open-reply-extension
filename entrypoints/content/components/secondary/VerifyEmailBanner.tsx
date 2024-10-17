// Packages:
import useAuth from '../../hooks/useAuth'
import logError from 'utils/logError'
import { useToast } from '../ui/use-toast'
import { Button } from '../ui/button'

// Functions:
const VerifyEmailBanner = () => {
  // Constants:
  const { toast } = useToast()
  const {
    isEmailVerified,
    handleSendVerificationEmail,
    handleCheckIfEmailIsVerified,
  } = useAuth()

  // Functions:
  const _handleSendVerificationEmail = async () => {
    try {
      const { status, payload } = await handleSendVerificationEmail()
      if (!status) throw payload

      toast({
        title: 'Verification email sent!',
        description: "Please check your inbox for the email verification link.",
      })
    } catch(error) {
      logError({
        functionName: 'VerifyEmailBanner._handleSendVerificationEmail',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    }
  }

  const _handleCheckIfEmailIsVerified = async () => {
    try {
      const { status, payload } = await handleCheckIfEmailIsVerified()
      if (!status) throw payload

      if (payload) toast({
        title: 'Your email is verified!',
        description: 'You can now use all the features on OpenReply.',
      })
      else toast({
        title: 'Your email is not yet verified!',
        description: 'Please check your inbox for the email verification link.',
      })
    } catch(error) {
      logError({
        functionName: 'VerifyEmailBanner.handleCheckIfEmailIsVerified',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    }
  }

  // Return:
  return !isEmailVerified && (
    <div className='fixed z-[2] bottom-0 flex justify-center items-center gap-4 w-[50vw] max-w-[54rem] h-14 px-5 bg-yellow text-black'>
      <p className='font-semibold text-lg'>Your email is unverified!</p>
      <div className='flex justify-center items-center gap-2'>
        <Button
          size='sm'
          variant='default'
          onClick={_handleSendVerificationEmail}
          >
          Resend Verification
        </Button>
        <Button
          size='sm'
          variant='default'
          onClick={_handleCheckIfEmailIsVerified}
          >
          I've Verified It
        </Button>
      </div>
    </div>
  )
}

// Exports:
export default VerifyEmailBanner
