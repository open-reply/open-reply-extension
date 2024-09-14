// Packages:
import React from 'react'

// UI:
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

// Icons:
import { ArrowBigDown, ArrowBigUp, Ellipsis, Forward, MessageSquare } from 'lucide-react'

// Functions:
const Feed = () => {
  return (
    <main className='w-full pt-16 bg-white' style={{ height: 'calc(100% - 68px)' }}>
      <div className="flex m-4 space-x-4">
        <div className="flex-none">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        </div>
        <div className="flex-initial">
          <div className='flex flex-col space-y-1 text-sm'>
            {/* user details and posted since time*/}
            <div className='flex items-center space-x-2'>
              <h1 className='font-semibold'>Ben Holmes</h1>
              <p>@BenHolmesDev</p>
              <p className='self-center'>•</p>
              <p>17h</p>
            </div>
            <div>
              <p className='text-sm'>Right when I heard Stephen first talk I had a gut feeling that it was him. 
                Just the way he talked about the situation it's like he had already come to terms with something as crazy and 
                as random as an explosion. Bro had a eulogy ready for her and everything.
              </p>
            </div>
            <div className='flex space-x-6 items-center pt-1 -ml-[px]'>
              <div className='flex space-x-2 items-center'>
                <ArrowBigUp  size={18} fill='#059669' color='#059669' />
                <p className='text-[12px]'> 36 </p>
                <ArrowBigDown size={18} />
              </div>
              <div className='flex space-x-2 items-center'>
                <MessageSquare size={14}/>
                <p className='text-[13px]'>Reply</p>
              </div>
              <div className='flex space-x-1 items-center'>
                <Forward size={18} />
                <p className='text-[13px]'>Share</p>
              </div>
              <div>
                <Ellipsis size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Exports:
export default Feed
