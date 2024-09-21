// Packages:
import useUserPreferences from '../../hooks/useUserPreferences'
import { cn } from '../../lib/utils'

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
const AppearanceForm = () => {
  // Constants:
  const {
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
        <Select
          defaultValue={appearance.theme}
          onValueChange={theme => setTheme(theme as Theme)}
          disabled={isUserPreferencesLoading}
        >
          <SelectTrigger className='text-xs w-44 h-fit px-2.5 py-2'>
            <SelectValue placeholder='Select Theme' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={Theme.Light}>Light</SelectItem>
              <SelectItem value={Theme.Dark}>Dark</SelectItem>
              <SelectItem value={Theme.System}>System Default</SelectItem>
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
        <div className='w-full h-fit flex flex-row flex-wrap gap-y-2 gap-x-4 justify-start'>
          <div
            className={cn(
              'flex flex-col gap-[2px] items-center cursor-pointer',
              isUserPreferencesLoading && 'pointer-events-none cursor-default'
            )}
            onClick={() => {
              if (!isUserPreferencesLoading)
                setVisibility(Visibility.ShowTopComment)
            }}
          >
            <div
              className={cn(
                'p-[2px] rounded-lg',
                appearance.visibility === Visibility.ShowTopComment &&
                  'border-2 border-brand-primary'
              )}
            >
              <div
                className={cn(
                  'h-24 aspect-video bg-[#ECEDEF] rounded-sm relative',
                  isUserPreferencesLoading && 'opacity-85'
                )}
              >
                <div className='absolute bottom-2 right-2 w-11 bg-placeholder h-2.5 rounded-2xl' />
              </div>
            </div>
            <p className='text-xs'>Show Top Comment</p>
          </div>
          <div
            className={cn(
              'flex flex-col gap-[2px] items-center cursor-pointer',
              isUserPreferencesLoading && 'pointer-events-none cursor-default'
            )}
            onClick={() => {
              if (!isUserPreferencesLoading)
                setVisibility(Visibility.BubbleOnBottomRight)
            }}
          >
            <div
              className={cn(
                'p-[2px] rounded-lg',
                appearance.visibility === Visibility.BubbleOnBottomRight &&
                  'border-2 border-brand-primary'
              )}
            >
              <div
                className={cn(
                  'h-24 aspect-video bg-[#ECEDEF] rounded-sm relative',
                  isUserPreferencesLoading && 'opacity-85'
                )}
              >
                <div className='absolute bottom-2 right-2 h-2.5 aspect-square bg-placeholder rounded-full' />
              </div>
            </div>
            <p className='text-xs'>Bottom Right</p>
          </div>
          <div
            className={cn(
              'flex flex-col gap-[2px] items-center cursor-pointer',
              isUserPreferencesLoading && 'pointer-events-none cursor-default'
            )}
            onClick={() => {
              if (!isUserPreferencesLoading) setVisibility(Visibility.NoOverlay)
            }}
          >
            <div
              className={cn(
                'p-[2px] rounded-lg',
                appearance.visibility === Visibility.NoOverlay &&
                  'border-2 border-brand-primary '
              )}
            >
              <div
                className={cn(
                  'h-24 aspect-video bg-[#ECEDEF] rounded-sm relative',
                  isUserPreferencesLoading && 'opacity-85'
                )}
              >
                <div className='absolute flex flex-row justify-end w-full h-4 pt-1 pr-1 bg-[#E5E5E5] rounded-t-sm border-b border-b-border-primary'>
                  <div className='w-2 bg-placeholder h-2 rounded-full' />
                </div>
              </div>
            </div>
            <p className='text-xs'>Extensions Panel</p>
          </div>
          <div
            className={cn(
              'flex flex-col gap-[2px] items-center cursor-pointer',
              isUserPreferencesLoading && 'pointer-events-none cursor-default'
            )}
            onClick={() => {
              if (!isUserPreferencesLoading)
                setVisibility(Visibility.BubbleOnBottomLeft)
            }}
          >
            <div
              className={cn(
                'p-[2px] rounded-lg',
                appearance.visibility === Visibility.BubbleOnBottomLeft &&
                  'border-2 border-brand-primary'
              )}
            >
              <div
                className={cn(
                  'h-24 aspect-video bg-[#ECEDEF] rounded-sm relative',
                  isUserPreferencesLoading && 'opacity-85'
                )}
              >
                <div className='absolute bottom-2 left-2 h-2.5 aspect-square bg-placeholder rounded-full' />
              </div>
            </div>
            <p className='text-xs'>Bottom Left</p>
          </div>
        </div>
      </div>
    </>
  )
}

// Exports:
export default AppearanceForm
