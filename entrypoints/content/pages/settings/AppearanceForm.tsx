// Packages:
import useUserPreferences from '../../hooks/useUserPreferences'

// Typescript:
import { Theme, Visibility } from 'types/user-preferences'

// Components:
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

// Functions:
function AppearanceForm() {
  // Constants:
  const {
    // TODO: Disable all inputs across /settings when isUserPreferencesLoading is true.
    isLoading: isUserPreferencesLoading,
    appearance,
    setTheme,
    setVisibility,
  } = useUserPreferences()

  // Return:
  return (
    <>
      <div className='flex flex-row justify-between align-middle items-center'>
        <div className='flex flex-col'>
          <h3 className='text-sm font-base text-brand-primary'>Theme</h3>
          <p className='text-xs font-base text-brand-secondary'>
            Select the theme for the extension.
          </p>
        </div>
        <Select defaultValue={Theme.System}>
          <SelectTrigger className='text-xs w-44 h-fit px-2.5 py-2'>
            <SelectValue placeholder='Select Theme' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='Light'>Light</SelectItem>
              <SelectItem value='Dark'>Dark</SelectItem>
              <SelectItem value='System'>System Default</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-col justify-start align-middle items-start gap-4'>
        <div className='flex flex-col'>
          <h3 className='text-sm font-base text-brand-primary'>Visibility</h3>
          <p className='text-xs font-base text-brand-secondary'>
            Select how you’d like to launch OpenReply.
          </p>
        </div>
        <div className='w-full h-fit flex flex-row flex-wrap gap-y-5 gap-x-8 justify-start'>
          <div className='w-1/3 h-28 flex flex-col gap-1 items-center'>
            <div className={'w-full h-full bg-overlay rounded-sm relative'}>
              <div
                className={
                  'absolute w-[30%] bg-placeholder h-[10%] rounded-2xl bottom-[10%] right-[10%]'
                }
              ></div>
            </div>
            <p className='text-xs'>Show Top Comment</p>
          </div>
          <div className='w-1/3 h-28 flex flex-col gap-1 items-center'>
            <div className={'w-full h-full bg-overlay rounded-sm relative'}>
              <div
                className={
                  'absolute w-[7%] bg-placeholder h-[10%] rounded-3xl bottom-[10%] right-[10%]'
                }
              ></div>
            </div>
            <p className='text-xs'>Bottom Right</p>
          </div>
          <div className='w-1/3 h-28 flex flex-col gap-1 items-center'>
            <div className={'w-full h-full bg-overlay rounded-sm relative'}>
              <div
                className={
                  'absolute w-full bg-[#e5e5e5] h-[15%] rounded-t-sm border-b border-b-[#cbd5e1] flex flex-row justify-end pt-1 pr-1'
                }
              >
                <div className={'w-2 bg-placeholder h-2 rounded-3xl'}></div>
              </div>
            </div>
            <p className='text-xs'>Extensions Panel</p>
          </div>
          <div className='w-1/3 h-28 flex flex-col gap-1 items-center'>
            <div className={'w-full h-full bg-overlay rounded-sm relative'}>
              <div
                className={
                  'absolute w-[7%] bg-placeholder h-[10%] rounded-3xl bottom-[10%] left-[10%]'
                }
              ></div>
            </div>
            <p className='text-xs'>Bottom Left</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default AppearanceForm
