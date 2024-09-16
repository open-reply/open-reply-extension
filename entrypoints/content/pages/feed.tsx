// Packages:
import React from 'react'

// Imports:
import { ArrowBigDown, ArrowBigUp, Ellipsis, Forward, MessageSquare } from 'lucide-react'

// Components:
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import Comment from '../components/secondary/comment/Comment'

const SAMPLE_USER_INFO = {
  name: 'Ben Holmes',
  username: '@BenHolmesDev',
  timePosted: '17h',
  profileImgUrl: 'https://github.com/shadcn.png'
}

const SAMPLE_CONTENT = `Right when I heard Stephen first talk I had a gut feeling that it was him. 
Just the way he talked about the situation it's like he had already come to terms with something as crazy and as random as an explosion. 
Bro had a eulogy ready for her and everything.`

// Functions:
const Feed = () => {
  return (
    <main className='w-full pt-16 bg-white' style={{ height: 'calc(100% - 68px)' }}>
      <Comment userInfo={SAMPLE_USER_INFO} 
      comment={{
        body: SAMPLE_CONTENT,
        voteCount: {
          up: 40,
          down: 4,
          controversy: 5,
          wilsonScore: 5
        }
      }} />
    </main>
  )
}

// Exports:
export default Feed
