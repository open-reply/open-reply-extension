// Packages:
import useUserPreferences from '../../hooks/useUserPreferences'
import { cn } from '../../lib/utils'

// Typescript:
import { WebsiteFlagBannerPosition } from 'types/user-preferences'
import { WebsiteRiskLevel } from 'utils/websiteFlagInfo'

// Constants:
import { RISK_LEVEL_VALUE_MAP } from 'utils/websiteFlagInfo'

// Components:
import { Switch } from '../../components/ui/switch'
import { Slider } from '../../components/ui/slider'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Label } from '../../components/ui/label'

// Functions:
const SafetyForm = () => {
  // Constants:
  const {
    isLoading: isUserPreferencesLoading,
    safety,
    setWebsiteWarningEnabled,
    setWebsiteWarningWarnAt,
    setWebsiteWarningPosition,
  } = useUserPreferences()

  // Functions:
  const handleSliderChange = (value: number[]) => {
    const sliderValue = value[0]
    switch (sliderValue) {
      case 0:
        setWebsiteWarningWarnAt(WebsiteRiskLevel.MINIMAL)
        break
      case 25:
        setWebsiteWarningWarnAt(WebsiteRiskLevel.LOW)
        break
      case 50:
        setWebsiteWarningWarnAt(WebsiteRiskLevel.MODERATE)
        break
      case 75:
        setWebsiteWarningWarnAt(WebsiteRiskLevel.HIGH)
        break
      case 100:
        setWebsiteWarningWarnAt(WebsiteRiskLevel.SEVERE)
        break
      default:
        setWebsiteWarningWarnAt(WebsiteRiskLevel.MODERATE)
    }
  }

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
        <Switch
          className='scale-75'
          disabled={isUserPreferencesLoading}
          checked={safety.websiteWarning.enabled}
          onCheckedChange={websiteWarning => setWebsiteWarningEnabled(websiteWarning)}
        />
      </div>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-regular'>Intelligent Warning</h3>
        <p className='text-xs font-regular text-brand-secondary pb-1'>
          Not all websites are equally dangerous. Choose when we should warn
          you, based on the website’s risk level.
        </p>
        <Slider
          step={25}
          thumbClassName='h-4 w-4 cursor-pointer hover:bg-border-primary transition-all'
          disabled={isUserPreferencesLoading}
          defaultValue={[RISK_LEVEL_VALUE_MAP[safety.websiteWarning.warnAt]]}
          onValueCommit={handleSliderChange}
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
          <RadioGroup
            defaultValue={safety.websiteWarning.position}
            onValueChange={websiteFlagBannerPosition => setWebsiteWarningPosition(websiteFlagBannerPosition as WebsiteFlagBannerPosition)}
            disabled={isUserPreferencesLoading}
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
              className={
                cn(
                  'absolute w-full bg-rose-500 h-[10%] transition-[bottom] duration-700',
                  safety.websiteWarning.position === WebsiteFlagBannerPosition.Bottom ? 'rounded-t-sm bottom-[calc(100%-10%)]' : 'rounded-b-sm bottom-0',
                )
              }
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Exports:
export default SafetyForm
