// Packages:
import useUserPreferences from '../../hooks/useUserPreferences'

// Components:
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

// Functions:
const ModerationForm = () => {
  // Constants:
  const {
    isLoading: isUserPreferencesLoading,
    moderation,
    setCheckOwnCommentForOffensiveSpeech,
    setUnsafeContentPolicy,
    setUnsafeWebsitePreviewsPolicy,
  } = useUserPreferences()

  // Return:
  return (
    <>
      <div className='flex flex-row justify-between align-middle items-center'>
        <p className='text-sm font-regular text-brand-secondary'>
          Check your own comment for offensive speech before posting?{' '}
        </p>
        <Switch className='scale-75' />
      </div>
      <div className='flex flex-row justify-between'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-sm'>Unsafe Content Policy</h2>
          <p className='text-xs font-normal text-brand-secondary'>
            Select the default behavior for dealing with unsafe <br />
            content, such as comments and replies.{' '}
          </p>
        </div>
        <Select defaultValue='block'>
          <SelectTrigger className='text-xs w-fit'>
            <SelectValue placeholder='Lorem' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem className='text-xs' value='block'>
                Blur Unsafe Content
              </SelectItem>
              <SelectItem className='text-xs' value='warn'>
                Warn
              </SelectItem>
              <SelectItem className='text-xs' value='allow'>
                Allow
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-row justify-between'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-sm'>Unsafe Website Previews Policy</h2>
          <p className='text-xs font-normal text-brand-secondary'>
            Select the default behavior for dealing with the
            <br /> previews of unsafe websites.{' '}
          </p>
        </div>
        <Select defaultValue='block'>
          <SelectTrigger className='text-xs w-fit'>
            <SelectValue placeholder='Lorem' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem className='text-xs' value='block'>
                Blur Unsafe Content
              </SelectItem>
              <SelectItem className='text-xs' value='warn'>
                Warn
              </SelectItem>
              <SelectItem className='text-xs' value='allow'>
                Allow
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

// Exports:
export default ModerationForm
