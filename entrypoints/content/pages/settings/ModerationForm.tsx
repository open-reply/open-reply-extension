// Packages:
import useUserPreferences from '../../hooks/useUserPreferences'
import { useEffect } from 'react'

// Typescript:
import {
  UnsafeContentPolicy,
  UnsafeWebsitePreviewsPolicy,
} from 'types/user-preferences'

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
    loadUserPreferences,
    moderation,
    setCheckOwnCommentForOffensiveSpeech,
    setUnsafeContentPolicy,
    setUnsafeWebsitePreviewsPolicy,
  } = useUserPreferences()

  // Effects:
  useEffect(() => {
    loadUserPreferences()
  }, [])

  // Return:
  return (
    <>
      <div className='flex flex-row justify-between align-middle items-center'>
        <p className='text-sm font-regular text-brand-secondary'>
          Check your own comment for offensive speech before posting?
        </p>
        {/* TODO: Verify Implementation */}
        <Switch
          className='scale-75'
          defaultChecked
          onCheckedChange={OffensiveState =>
            setCheckOwnCommentForOffensiveSpeech(OffensiveState)
          }
          disabled={!isUserPreferencesLoading}
        />
      </div>
      <div className='flex flex-row justify-between items-center'>
        <div className='flex flex-col gap-1 w-2/3'>
          <h2 className='text-sm'>Unsafe Content Policy</h2>
          <p className='text-xs font-normal text-brand-secondary'>
            Select the default behavior for dealing with unsafe content, such as
            comments and replies.
          </p>
        </div>
        <Select
          defaultValue={moderation.unsafeContentPolicy}
          onValueChange={unsafeContentPolicy =>
            setUnsafeContentPolicy(unsafeContentPolicy as UnsafeContentPolicy)
          }
          disabled={!isUserPreferencesLoading}
        >
          <SelectTrigger className='text-xs w-44 h-fit px-2.5 py-2'>
            <SelectValue placeholder='Unsafe Content Policy' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                className='text-xs'
                value={UnsafeContentPolicy.BlurUnsafeContent}
              >
                Blur Unsafe Content
              </SelectItem>
              <SelectItem
                className='text-xs'
                value={UnsafeContentPolicy.ShowAll}
              >
                Show All
              </SelectItem>
              <SelectItem
                className='text-xs'
                value={UnsafeContentPolicy.FilterUnsafeContent}
              >
                Filter Unsafe Content
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-row justify-between items-center'>
        <div className='flex flex-col gap-1 w-3/6'>
          <h2 className='text-sm'>Unsafe Website Previews Policy</h2>
          <p className='text-xs font-normal text-brand-secondary'>
            Select the default behavior for dealing with the previews of unsafe
            websites.
          </p>
        </div>
        <Select
          defaultValue={moderation.unsafeWebsitePreviewsPolicy}
          onValueChange={unsafeWebsitePreviewsPolicy =>
            setUnsafeWebsitePreviewsPolicy(
              unsafeWebsitePreviewsPolicy as UnsafeWebsitePreviewsPolicy
            )
          }
          disabled={!isUserPreferencesLoading}
        >
          <SelectTrigger className='text-xs w-60 h-fit px-2.5 py-2'>
            <SelectValue placeholder='Unsafe Website Previews Policy' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                className='text-xs'
                value={UnsafeWebsitePreviewsPolicy.BlurUnsafeWebsitePreviews}
              >
                Blur Unsafe Website Previews
              </SelectItem>
              <SelectItem
                className='text-xs'
                value={UnsafeWebsitePreviewsPolicy.ShowAllWebsitePreviews}
              >
                Show All Website Previews
              </SelectItem>
              <SelectItem
                className='text-xs'
                value={UnsafeWebsitePreviewsPolicy.FilterUnsafeWebsitePreviews}
              >
                Filter Unsafe Website Previews
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
