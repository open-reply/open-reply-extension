// Packages:
import useUserPreferences from '../hooks/useUserPreferences'

// Typescript:
import { UnsafeContentPolicy } from 'types/user-preferences'

// Imports:
import {
  Camera,
  EllipsisIcon,
  Link2Icon,
} from 'lucide-react'

// Constants:
import { commentFixtures } from '@/fixtures/comment'

// Components:
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Separator } from '../components/ui/separator'
import Comment from '../components/secondary/comment/Comment'
import { ScrollArea } from '../components/ui/scroll-area'

// Functions:
const Profile = () => {
  // Constants:
  const { moderation } = useUserPreferences()

  // Return:
  return (
    <main className='flex flex-col w-full h-[calc(100vh-68px)] mt-[68px] bg-white'>
      <div className='flex flex-row items-start gap-10 w-full h-[22.5%] p-7'>
        <div className='h-fit relative rounded-full brightness-100 cursor-pointer transition-all duration-500'>
          <Avatar className='w-32 h-32 brightness-75'>
            <AvatarImage src='https://github.com/shadcn.png' />
            <AvatarFallback className='text-5xl bg-[#84A5F0]'>BH</AvatarFallback>
          </Avatar>
          <Camera className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-auto' color='#ffffff' />
        </div>
        <div className='w-full flex flex-col gap-3'>
          <div className='flex flex-row justify-between'>
            <div className='flex flex-col'>
              <h1 className='text-xl font-bold'>Ben Holmes</h1>
              <h4 className='text-sm text-brand-tertiary'>@benholmes</h4>
            </div>
            <div className='flex flex-row gap-2'>
              <Button className='h-8'>
                Follow
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='h-8 w-8 p-0'>
                    <EllipsisIcon size={18} strokeWidth={1} className='fill-brand-primary' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    className='text-xs font-medium cursor-pointer'
                  >
                    Mute
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='text-rose-600 text-xs font-medium cursor-pointer hover:!bg-rose-200 hover:!text-rose-600'
                  >
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className='text-sm'>
            <pre className='whitespace-pre-wrap font-sans'>
              Software engineer, coffee enthusiast, and amateur photographer. Building the future, one line of code at a time.
            </pre>
          </div>
          <div className='flex flex-row gap-4'>
            <p className='text-sm font-bold cursor-pointer'>
              1234 <span className='font-normal hover:underline'>Followers</span>
            </p>
            <p className='text-sm font-bold cursor-pointer'>
              567 <span className='font-normal hover:underline'>Following</span>
            </p>
          </div>
          <div className='flex flex-row gap-4'>
            <div className='text-sm text-blue font-regular hover:underline cursor-pointer flex flex-row gap-1'>
              <Link2Icon className='w-3.5 -mt-0.5 text-blue -rotate-[45deg]' strokeWidth={2} /> <p>Personal Website</p>
            </div>
            <div className='text-sm text-blue font-regular hover:underline cursor-pointer flex flex-row gap-1'>
              <Link2Icon className='w-3.5 -mt-0.5 text-blue -rotate-[45deg]' strokeWidth={2} /> <p>GitHub</p>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <ScrollArea className='w-full h-[77.5%]' hideScrollbar>
        <div className='flex flex-col gap-4 w-full px-4 pt-7'>
          {[...commentFixtures, ...commentFixtures]
            .filter(
              comment =>
                !comment.isDeleted &&
                !comment.isRemoved &&
                !comment.isRestricted &&
                (moderation.unsafeContentPolicy === UnsafeContentPolicy.FilterUnsafeContent
                  ? !comment.hateSpeech.isHateSpeech
                  : true)
            )
            .map(comment => (
              <Comment comment={comment} key={comment.id} />
            ))}
        </div>
      </ScrollArea>
    </main>
  )
}

// Exports:
export default Profile
