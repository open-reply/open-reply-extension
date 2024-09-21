// Packages:
import { useState, useEffect } from 'react'
import useUtility from '../../../hooks/useUtility'
import { cn } from '../../../lib/utils'

// Components:
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '../../ui/dialog'
import LoadingIcon from '../../primary/LoadingIcon'

// Functions:
const ProfileBubble = () => {
  // Constants:
  const { isActive } = useUtility()

  // State:
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Effects:
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Return:
  return (
    <Dialog onOpenChange={_isDialogOpen => setIsDialogOpen(_isDialogOpen)}>
      <DialogTrigger asChild>
        <div
          className={
            cn(
              'flex justify-center items-center',
              'w-10 h-10 bg-white hover:bg-zinc-300 text-black text-xl hover:text-zinc-700 border-2 border-slate-200 hover:border-none rounded-full cursor-pointer transition-all duration-300',
              (isActive && isLoaded) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
              isDialogOpen && 'bg-zinc-300 text-zinc-900 border-none hover:black cursor-auto pointer-events-none'
            )
          }
        >
          🤬
        </div>
      </DialogTrigger>
      <DialogContent className='py-4 px-5'>
        <div className='relative flex justify-center items-center w-full h-[35rem]'>
          <LoadingIcon />
          <iframe
            className='absolute w-full h-full border-none'
            id='user-feedback-panhuq'
            src='https://noteforms.com/forms/user-feedback-panhuq'
          />
          {/* <script type="text/javascript" onload="initEmbed('user-feedback-panhuq')" src="https://noteforms.com/widgets/iframe.min.js" /> */}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Exports:
export default ProfileBubble
