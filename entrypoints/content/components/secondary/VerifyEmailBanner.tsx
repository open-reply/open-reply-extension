// Packages:
import useAuth from '../../hooks/useAuth'
import logError from 'utils/logError'
import { useToast } from '../ui/use-toast'

// Functions:
const VerifyEmailBanner = () => {
  // Constants:
  const { toast } = useToast()
  const {
    isEmailVerified,
    handleSendVerificationEmail,
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

  // Return:
  return !isEmailVerified && (
    <div className='fixed z-[2] bottom-0 flex justify-center items-center w-[50vw] max-w-[54rem] h-10 px-5 text-base font-medium bg-yellow text-black'>
      <span>
        Please verify your email. <span className='font-bold cursor-pointer hover:underline' onClick={_handleSendVerificationEmail}>Click here</span> to resend the verification email.
      </span>
    </div>
  )
}

// Exports:
export default VerifyEmailBanner
