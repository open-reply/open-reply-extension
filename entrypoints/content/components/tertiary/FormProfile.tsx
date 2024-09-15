//Packages:
import { useState, useEffect } from 'react'
import useUserPreferences from '../../hooks/useUserPreferences'

// Components:
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'

const FormProfile = () => {
  //State:
  const [radioValue, setradioValue] = useState('option-one')

  //Constants:
  const {
    isLoading,
    safety,
    setWebsiteWarningEnabled,
    setWebsiteWarningWarnAt,
    setWebsiteWarningPosition,
    loadUserPreferences,
  } = useUserPreferences()

  //Effects:
  useEffect(() => {
    async function handleLoad() {
      console.log(await loadUserPreferences())
    }
    handleLoad()
  }, [])

  //Return:
  return (
    <>
      {isLoading ? (
        <>
          <span className='flex flex-col'>
            <h1 className='text-2xl font-medium'>Profile</h1>
            <h2 className='text-base font-regular text-brand-secondary'>
              Manage your safety on the internet.
            </h2>
          </span>
          <span className='flex flex-col'>
            <h3 className='text-base font-semibold'>Website Warning</h3>
            <p className='text-xs font-regular text-brand-secondary'>
              Control how safety banners are shown on unsafe websites.{' '}
            </p>
          </span>
          <span className='flex flex-row justify-between h-fit align-middle items-center'>
            <h3 className='text-sm font-regular'>Display Safety Banner</h3>
            <Switch className='scale-75' />
          </span>
          <span className='flex flex-col gap-1'>
            <h3 className='text-sm font-regular'>Intelligent Warning</h3>
            <p className='text-xs font-regular text-brand-secondary pb-1'>
              Not all websites are equally dangerous. Choose when we should warn
              you, based on the website’s risk level.{' '}
            </p>
            <Slider step={25} thumbClassName='h-4 w-4' />
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
          </span>
          <span className='flex flex-col gap-1'>
            <h3 className='text-sm font-regular'>Safety Banner Position</h3>
            <p className='text-xs font-regular text-brand-secondary pb-3'>
              Select where the safety banner should be shown.{' '}
            </p>
            <div className='flex flex-row justify-start gap-10 w-2/3 min-h-24'>
              <RadioGroup
                defaultValue='option-one'
                onValueChange={(e) => setradioValue(e)}
                className='flex flex-col gap-2'
              >
                <div className='flex items-center gap-2'>
                  <RadioGroupItem
                    value='option-one'
                    id='option-one'
                    className='h-3 w-3'
                    indicatorCircleClassName='h-1 w-1'
                  />
                  <Label htmlFor='option-one' className='text-xs'>
                    Top
                  </Label>
                </div>
                <div className='flex items-center gap-2'>
                  <RadioGroupItem
                    value='option-two'
                    id='option-two'
                    className='h-3 w-3'
                    indicatorCircleClassName='h-1 w-1'
                  />
                  <Label htmlFor='option-two' className='text-xs'>
                    Bottom
                  </Label>
                </div>
              </RadioGroup>
              <div className={'w-1/2 bg-overlay rounded-sm relative'}>
                <div
                  className={`absolute w-full bg-rose-500 h-[10%] transition-[bottom] duration-700 ${
                    radioValue === 'option-one'
                      ? 'rounded-t-sm bottom-[calc(100%-10%)]'
                      : 'rounded-b-sm bottom-0'
                  }`}
                ></div>
              </div>
            </div>
          </span>
        </>
      ) : (
        'POTTY'
      )}
    </>
  )
}

export default FormProfile
