// Components:
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Separator } from '../components/ui/separator'

// Imports:
import { Camera } from 'lucide-react'
import { Link2Icon } from '@radix-ui/react-icons'

function Profile({ children }: { children: React.ReactNode }) {
  // Return:
  return (
    <main className='w-full pt-16 bg-white' style={{ height: 'calc(100% - 68px)' }}>
      <div className='w-full h-fit p-8 pb-6 flex flex-row gap-10'>
        <div className='h-fit relative rounded-full brightness-100 cursor-pointer transition-all duration-500'>
          <Avatar className='w-32 h-32 brightness-75'>
            <AvatarImage src={'https://github.com/shadcn.png'} />
            <AvatarFallback className='text-5xl bg-[#84A5F0]'>BH</AvatarFallback>
          </Avatar>
          <Camera className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-auto' color='#ffffff' />
        </div>
        <div className='w-full flex flex-col gap-3'>
          <div className='flex flex-row justify-between'>
            <div className='flex flex-col'>
              <h1 className='text-2xl font-bold'>Ben Holmes</h1>
              <h4 className='text-base text-brand-tertiary'>@benholmes</h4>
            </div>
            <div className='space-x-2'>
              <Button size={'sm'} className='h-8'>
                Follow
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size={'sm'} variant={'outline'} className='h-8'>
                    ...
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem>Mute</DropdownMenuItem>
                  <DropdownMenuItem className='text-rose-600 hover:!bg-rose-200 hover:!text-rose-600'>
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className='text-base'>
            Software engineer, coffee enthusiast, and amateur photographer. Building the future, one line of code at a
            time
          </p>
          <div className='flex flex-row gap-4'>
            <p className='text-base font-bold cursor-pointer'>
              1234 <span className='font-normal hover:underline'>Followers</span>
            </p>
            <p className='text-base font-bold cursor-pointer'>
              567 <span className='font-normal hover:underline'>Following</span>
            </p>
          </div>
          <div className='flex flex-row gap-4'>
            <div className='text-sm text-blue font-regular hover:underline cursor-pointer flex flex-row gap-1'>
              <Link2Icon /> <p>Personal Website</p>
            </div>
            <div className='text-sm text-blue font-regular hover:underline cursor-pointer flex flex-row gap-1'>
              <Link2Icon /> <p>GitHub</p>
            </div>
          </div>
        </div>
      </div>
      <Separator />
    </main>
  )
}

export default Profile
