// Packages:
import useUtility from '../hooks/useUtility'
import { truncate } from 'lodash'

// Components:
import {
  DownvoteBubble,
  UpvoteBubble,
} from '../components/secondary/bubbles/VoteBubble'
import FlagBubble from '../components/secondary/bubbles/FlagBubble'

// Functions:
const Website = () => {
  // Constants:
  const {
    currentDomain,
    title,
    description,
  } = useUtility()

  // State:
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [isDownvoted, setIsDownvoted] = useState(false)

  // Return:
  return (
    <>
      <div className='absolute z-[1] top-[68px] -left-14 flex flex-col gap-3'>
        <UpvoteBubble
          isHighlighted={isUpvoted}
          count={1655}
          onClick={() => {
            if (isDownvoted) setIsDownvoted(false)
            setIsUpvoted(_isUpvoted => !_isUpvoted)
          }}
        />
        <DownvoteBubble
          isHighlighted={isDownvoted}
          count={20}
          onClick={() => {
            if (isUpvoted) setIsUpvoted(false)
            setIsDownvoted(_isDownvoted => !_isDownvoted)
          }}
        />
        <FlagBubble onClick={() => {}} />
      </div>
      <main className='w-full pt-16 bg-white' style={{ height: 'calc(100% - 68px)' }}>
        <div className='flex flex-col gap-2.5 w-full py-10 px-10 border-b-2 border-b-slate-200'>
          <div className='flex justify-center items-center flex-row gap-4'>
            {
              currentDomain && (
                <div
                  className='w-14 h-14'
                  style={{
                    backgroundImage: `url(https://www.google.com/s2/favicons?sz=64&domain_url=${ currentDomain })`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )
            }
            <h1 className='text-center font-semibold text-4xl text-black'>
              { truncate(title, { length: 30 }) }
            </h1>
          </div>
          <small className='mx-24 text-center text-sm italic text-zinc-600'>{ truncate(description, { length: 200 }) }</small>
        </div>
      </main>
    </>
  )
}

// Exports:
export default Website
