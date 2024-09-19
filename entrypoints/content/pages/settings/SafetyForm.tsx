// Packages:
import { useState, useEffect } from 'react'
import useUserPreferences from '../../hooks/useUserPreferences'

// Typescript:
import { WebsiteFlagBannerPosition } from 'types/user-preferences'

// Components:
import { Switch } from '../../components/ui/switch'
import { Slider } from '../../components/ui/slider'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Label } from '../../components/ui/label'

// Functions:
const SafetyForm = () => {
  // Constants:
  const {
    // TODO: Disable all inputs across /settings when isUserPreferencesLoading is true.
    isLoading: isUserPreferencesLoading,
    loadUserPreferences,
    safety,
    setWebsiteWarningEnabled,
    setWebsiteWarningWarnAt,
    setWebsiteWarningPosition,
  } = useUserPreferences()

  // State:
  const [bannerPositionPreference, setBannerPositionPreference] =
    useState<WebsiteFlagBannerPosition>(WebsiteFlagBannerPosition.Bottom)

  // Effects:
  useEffect(() => {
    loadUserPreferences()
  }, [])

  // Return:
  return (
    <>
      <div className='flex flex-col'>
        <h3 className='text-base font-medium'>Website Warning</h3>
        <p className='text-xs font-regular text-brand-secondary'>
          Control how safety banners are shown on unsafe websites.
        </p>
      </div>
      <div className='flex flex-row justify-between h-fit align-middle items-center'>
        <h3 className='text-sm font-regular'>Display Safety Banner</h3>
        {/* TODO: Verify Implementation */}
        <Switch
          className='scale-75'
          disabled={!isUserPreferencesLoading}
          onCheckedChange={WebsiteWarning =>
            setWebsiteWarningEnabled(WebsiteWarning)
          }
        />
      </div>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-regular'>Intelligent Warning</h3>
        <p className='text-xs font-regular text-brand-secondary pb-1'>
          Not all websites are equally dangerous. Choose when we should warn
          you, based on the website’s risk level.
        </p>
        {/* TODO: use setWebsiteWarningWarnAt */}
        <Slider
          step={25}
          thumbClassName='h-4 w-4 cursor-pointer hover:bg-border-primary transition-all'
          disabled={!isUserPreferencesLoading}
        />
        <div className='flex flex-row justify-between pt-1'>
          <span className='text-xs font-regular text-brand-secondary'>
            Minimal
          </span>
          <span className='text-xs font-regular text-brand-secondary'>
            Moderate
          </span>
          <span className='text-xs font-regular text-brand-secondary'>
            Severe
          </span>
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-regular'>Safety Banner Position</h3>
        <p className='text-xs font-regular text-brand-secondary pb-3'>
          Select where the safety banner should be shown.
        </p>
        <div className='flex flex-row justify-start gap-10 w-2/3 min-h-24'>
          {/* TODO: use setWebsiteWarningPosition */}
          <RadioGroup
            defaultValue={WebsiteFlagBannerPosition.Bottom}
            onValueChange={websiteFlagBannerPosition =>
              setBannerPositionPreference(
                websiteFlagBannerPosition as WebsiteFlagBannerPosition
              )
            }
            disabled={!isUserPreferencesLoading}
            className='flex flex-col gap-2'
          >
            <div className='flex items-center gap-2'>
              <RadioGroupItem
                value={WebsiteFlagBannerPosition.Top}
                id={WebsiteFlagBannerPosition.Top}
                className='h-3 w-3'
                indicatorCircleClassName='h-1 w-1'
              />
              <Label
                htmlFor={WebsiteFlagBannerPosition.Top}
                className='text-xs cursor-pointer'
              >
                {WebsiteFlagBannerPosition.Top}
              </Label>
            </div>
            <div className='flex items-center gap-2'>
              <RadioGroupItem
                value={WebsiteFlagBannerPosition.Bottom}
                id={WebsiteFlagBannerPosition.Bottom}
                className='h-3 w-3'
                indicatorCircleClassName='h-1 w-1'
              />
              <Label
                htmlFor={WebsiteFlagBannerPosition.Bottom}
                className='text-xs cursor-pointer'
              >
                {WebsiteFlagBannerPosition.Bottom}
              </Label>
            </div>
          </RadioGroup>
          <div className={'w-1/2 bg-overlay rounded-sm relative'}>
            <div
              className={`absolute w-full bg-rose-500 h-[10%] transition-[bottom] duration-700 ${
                bannerPositionPreference === WebsiteFlagBannerPosition.Bottom
                  ? 'rounded-t-sm bottom-[calc(100%-10%)]'
                  : 'rounded-b-sm bottom-0'
              }`}
            ></div>
          </div>
        </div>
      </div>
    </>
  )
}

// Exports:
export default SafetyForm
