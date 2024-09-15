//Components:
import { Switch } from '../ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

//Functions:
const FormAccount = () => {
  return (
    <>
      <span className='flex flex-col'>
        <h1 className='text-2xl font-medium'>Account</h1>
        <h2 className='text-base font-regular text-brand-secondary'>
          Manage your content moderation preferences.
        </h2>
      </span>
      <span className='flex flex-row justify-between align-middle items-center'>
        <p className='text-sm font-regular text-brand-secondary'>
          Check your own comment for offensive speech before posting?{' '}
        </p>
        <Switch className='scale-75' />
      </span>
      <span className='flex flex-row justify-between'>
        <span className='flex flex-col gap-1'>
          <h2 className='text-sm'>Unsafe Content Policy</h2>
          <p className='text-xs font-normal text-brand-secondary'>
            Select the default behavior for dealing with unsafe <br />
            content, such as comments and replies.{' '}
          </p>
        </span>
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
      </span>
      <span className='flex flex-row justify-between'>
        <span className='flex flex-col gap-1'>
          <h2 className='text-sm'>Unsafe Website Previews Policy</h2>
          <p className='text-xs font-normal text-brand-secondary'>
            Select the default behavior for dealing with the
            <br /> previews of unsafe websites.{' '}
          </p>
        </span>
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
      </span>
    </>
  )
}

export default FormAccount
