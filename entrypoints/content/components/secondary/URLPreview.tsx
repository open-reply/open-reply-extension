// Packages:
import { useState, useEffect } from 'react'
import { getRDBWebsite } from '../../firebase/realtime-database/website/get'
import useUserPreferences from '../../hooks/useUserPreferences'
import {
  calculateWebsiteBaseRiskScore,
  calculateTemporalWebsiteRiskScore,
  determineWebsiteRiskLevel,
  triggerRiskLevel,
} from 'utils/websiteFlagInfo'
import logError from 'utils/logError'
import { cn } from '../../lib/utils'

// Typescript:
import type { RealtimeDatabaseWebsite } from 'types/realtime.database'
import { WebsiteFlagReason } from 'types/websites'
import { UnsafeWebsitePreviewsPolicy } from 'types/user-preferences'

// Imports:
import { TriangleAlertIcon, GlobeIcon } from 'lucide-react'

// Constants:
import { HARMFUL_WEBSITE_REASON_TEXT } from 'constants/database/websites'

// Components:
import { Skeleton } from '../ui/skeleton'
import { Button } from '../ui/button'

// Functions:
const URLPreview = ({
  URL,
  URLHash,
}: {
  URL: string
  URLHash: string
}) => {
  // Constants:
  const PLACEHOLDER_THUMBNAIL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1200px-Placeholder_view_vector.svg.png'
  const {
    safety: {
      websiteWarning,
    },
    moderation: {
      unsafeWebsitePreviewsPolicy,
    },
  } = useUserPreferences()

  // State:
  const [isFetchingRDBWebsite, setIsFetchingRDBWebsite] = useState(true)
  const [RDBWebsite, setRDBWebsite] = useState<RealtimeDatabaseWebsite>()
  const [websiteRiskLevel, setWebsiteRiskLevel] = useState<WebsiteRiskLevel>()
  const [websiteFlagReason, setWebsiteFlagReason] = useState<WebsiteFlagReason>()
  const [harmfulWebsiteReasonText, setHarmfulWebsiteReasonText] = useState<string>()
  const [shouldWarn, setShouldWarn] = useState(false)
  const [isSevere, setIsSevere] = useState(false)
  const [isWebsitePreviewHidden, setIsWebsitePreviewHidden] = useState(false)

  // Functions:
  const evaluateWebsiteWarning = (RDBWebsite: RealtimeDatabaseWebsite) => {
    const flagCount = RDBWebsite.flagInfo?.flagCount
    const flagsCumulativeWeight = RDBWebsite.flagInfo?.flagsCumulativeWeight
    const impressions = RDBWebsite.impressions
    const firstFlagTimestamp = RDBWebsite.flagInfo?.firstFlagTimestamp
    const impressionsSinceLastFlag = RDBWebsite.flagInfo?.impressionsSinceLastFlag
    const lastFlagTimestamp = RDBWebsite.flagInfo?.lastFlagTimestamp
    const flagDistribution = RDBWebsite.flagInfo?.flagDistribution
    if (flagDistribution) {
      const orderedFlags = Object.entries(flagDistribution).sort((flagA, flagB) => flagB[1] - flagA[1])
      if (orderedFlags.length > 0) {
        const topFlagReason = orderedFlags[0][0] as WebsiteFlagReason
        setWebsiteFlagReason(topFlagReason)
        setHarmfulWebsiteReasonText(HARMFUL_WEBSITE_REASON_TEXT[topFlagReason])
      }
    }

    if (
      flagCount &&
      flagsCumulativeWeight &&
      impressions &&
      firstFlagTimestamp &&
      impressionsSinceLastFlag &&
      lastFlagTimestamp
    ) {
      const baseRiskScore = calculateWebsiteBaseRiskScore({
        flagCount,
        flagsCumulativeWeight,
        impressions,
      })

      const temporalRiskScore = calculateTemporalWebsiteRiskScore({
        baseRiskScore,
        currentTimestamp: Date.now(),
        firstFlagTimestamp,
        flagCount,
        impressionsSinceLastFlag,
        lastFlagTimestamp,
      })

      const riskLevel = determineWebsiteRiskLevel(temporalRiskScore)
      setWebsiteRiskLevel(riskLevel)
    }
  }

  const fetchRDBWebsite = async () => {
    try {
      setIsFetchingRDBWebsite(true)
      const {
        status: getRDBWebsiteStatus,
        payload: getRDBWebsitePayload,
      } = await getRDBWebsite(URLHash)
      if (!getRDBWebsiteStatus) throw getRDBWebsitePayload

      if (getRDBWebsitePayload) {
        evaluateWebsiteWarning(getRDBWebsitePayload)
        setRDBWebsite(getRDBWebsitePayload)
        setIsWebsitePreviewHidden(
          !!getRDBWebsitePayload?.SEO?.isNSFW &&
          unsafeWebsitePreviewsPolicy === UnsafeWebsitePreviewsPolicy.BlurUnsafeWebsitePreviews
        )
      }
    } catch (error) {
      logError({
        functionName: 'URLPreview.fetchRDBWebsite',
        data: null,
        error,
      })
    } finally {
      setIsFetchingRDBWebsite(false)
    }
  }

  // Effects:
  // Fetch the website from Realtime Database.
  useEffect(() => {
    fetchRDBWebsite()
  }, [])

  // Determine if a warning should be shown for the website preview.
  useEffect(() => {
    if (websiteRiskLevel) {
      const shouldTrigger = triggerRiskLevel({
        current: websiteRiskLevel,
        threshold: websiteWarning.warnAt,
      })
      setShouldWarn(shouldTrigger)
      setIsSevere(websiteRiskLevel && [WebsiteRiskLevel.HIGH, WebsiteRiskLevel.SEVERE].includes(websiteRiskLevel))
    }
  }, [websiteRiskLevel, unsafeWebsitePreviewsPolicy])

  // Return:
  return (
    <div className='relative w-full'>
      {
        (!isWebsitePreviewHidden && shouldWarn) && (
          <a
            target='_blank'
            href={`https://openreply.app/flags#${ websiteFlagReason ?? '' }`}
            className={cn(
              'absolute -top-2.5 left-[-13px] z-10 py-1 px-2 pl-1.5 overflow-hidden rounded-2xl border-2 drop-shadow-md select-none cursor-pointer hover:brightness-95 transition-all',
              isSevere ? 'bg-red border-border-red' : 'bg-[#FFF7CD] border-yellow',
              !isSevere && 'w-[27px] hover:w-auto',
            )}
          >
            <div className='flex items-center justify-center gap-1 flex-row w-max h-full'>
              <TriangleAlertIcon
                className={cn(
                  'w-3.5 h-3.5',
                  isSevere ? 'text-white' : 'text-[#A18A1A]',
                )}
              />
              <span
                className={cn(
                  'w-[calc(100%-18px)] text-xs',
                  isSevere ? 'text-white' : 'text-[#A18A1A]',
                )}
              >
                This website has been reported for <span className='font-semibold'>{ harmfulWebsiteReasonText }</span> by our users. <span className='font-semibold'>Learn more</span>.
              </span>
            </div>
          </a>
        )
      }
      {
        isWebsitePreviewHidden && (
          <div
            className={cn(
              'absolute z-10 flex justify-center items-center w-full h-full rounded-lg border-[1px] border-border-primary overflow-hidden',
              isSevere ? 'bg-[#FFD4DC] text-white border-red' : 'bg-[#FFF7CD] border-yellow',
            )}
          >
            <Button
              className={cn(
                'transition-all hover:brightness-105 active:brightness-95',
                isSevere ? 'text-white bg-red hover:bg-red active:bg-red' : 'text-brand-primary bg-yellow hover:bg-yellow active:bg-yellow'
              )}
              onClick={() => setIsWebsitePreviewHidden(false)}
            >
              <GlobeIcon
                className='w-4 w-4 mr-2'
              />
              <span>Show unsafe website</span>
            </Button>
          </div>
        )
      }
      <a
        target='_blank'
        href={`https://${URL}`}
        className={cn(
          'flex w-full rounded-lg border-[1px] border-border-primary overflow-hidden select-none cursor-pointer group transition-all',
          shouldWarn ? (isSevere ? 'bg-[#DB465F] text-white border-red hover:brightness-95' : 'bg-[#FFF7CD] border-yellow hover:brightness-95') : 'hover:bg-overlay',
        )}
      >
        <div className='w-1/4 aspect-video overflow-hidden group-hover:brightness-95 transition-all'>
          <div
            className={cn(
              'w-full h-full bg-cover bg-no-repeat bg-center',
              (
                RDBWebsite?.SEO?.isNSFW &&
                unsafeWebsitePreviewsPolicy === UnsafeWebsitePreviewsPolicy.BlurUnsafeWebsitePreviews
              ) && 'blur-md',
            )}
            style={{
              backgroundImage: `url(${
                (
                  isFetchingRDBWebsite ||
                  !RDBWebsite?.SEO?.image
                ) ? PLACEHOLDER_THUMBNAIL : RDBWebsite.SEO.image
              })`,
            }}
          />
        </div>
        <div className='flex flex-col gap-0.5 w-3/4 h-full py-5 px-3'>
          {
            (isFetchingRDBWebsite || !RDBWebsite?.SEO?.title) ? (
              <Skeleton className='w-10 h-4' />
            ) : (
              <div
                className={cn(
                  'font-semibold text-base text-brand-primary',
                  (shouldWarn && isSevere) && 'text-white',
                )}
              >{RDBWebsite.SEO.title}</div>
            )
          }
          {
            (isFetchingRDBWebsite || !RDBWebsite?.SEO?.description) ? (
              <div className='flex items-start flex-col gap-1 w-full'>
                <Skeleton className='w-full h-3' />
                <Skeleton className='w-1/4 h-3' />
              </div>
            ) : (
              <div
                className={cn(
                  'font-medium text-xs',
                  shouldWarn && (isSevere ? 'text-[#FFC6C6]' : 'text-brand-secondary'),
                )}
              >
                {RDBWebsite.SEO.description}
              </div>
            )
          }
          <div
            className={cn(
              'font-medium text-[10px] text-brand-tertiary',
              shouldWarn && (isSevere ? 'text-[#E19595]' : 'text-[#B57B56]'),
            )}
          >
            {URL}
          </div>
        </div>
      </a>
    </div>
  )
}

// Exports:
export default URLPreview
