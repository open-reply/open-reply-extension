// Packages:
import useUtility from '../../hooks/useUtility'
import {
  calculateWebsiteBaseRiskScore,
  calculateTemporalWebsiteRiskScore,
  determineWebsiteRiskLevel,
  triggerRiskLevel,
} from 'utils/websiteFlagInfo'
import { getRDBWebsite } from '../../firebase/realtime-database/website/get'
import { cn } from '../../lib/utils'

// Typescript:
import { WebsiteRiskLevel } from 'utils/websiteFlagInfo'
import type { WebsiteFlagReason } from 'types/websites'

// Imports:
import { TriangleAlertIcon, XIcon } from 'lucide-react'

// Constants:
import { HARMFUL_WEBSITE_REASON_TEXT } from 'constants/database/websites'

// Functions:
const WebsiteFlagBanner = () => {
  // Constants:
  const currentURL = null
  const websiteWarning = { enabled: true, warnAt: WebsiteRiskLevel.MODERATE }
  // const { currentURL } = useUtility()
  // const { websiteWarning } = useUserPreferences()

  // State:
  const [websiteRiskLevel, setWebsiteRiskLevel] = useState<WebsiteRiskLevel>()
  const [websiteFlagReason, setWebsiteFlagReason] = useState<WebsiteFlagReason>()
  const [topWebsiteFlagText, setTopWebsiteFlagText] = useState<string>()
  const [shouldWarn, setShouldWarn] = useState(false)
  const [isSevere, setIsSevere] = useState(false)

  // Effects:
  useEffect(() => {
    if (currentURL) {
      (async () => {
        const URLHash = await getURLHash(currentURL)
        const { status: RDBWebsiteStatus, payload: RDBWebsitePayload } = await getRDBWebsite(URLHash)
        if (!RDBWebsiteStatus) {
          // TODO: Log the error here and on Sentry.
        } else {
          const flagCount = RDBWebsitePayload?.flagInfo?.flagCount
          const flagsCumulativeWeight = RDBWebsitePayload?.flagInfo?.flagsCumulativeWeight
          const impressions = RDBWebsitePayload?.impressions
          const firstFlagTimestamp = RDBWebsitePayload?.flagInfo?.firstFlagTimestamp
          const impressionsSinceLastFlag = RDBWebsitePayload?.flagInfo?.impressionsSinceLastFlag
          const lastFlagTimestamp = RDBWebsitePayload?.flagInfo?.lastFlagTimestamp
          const flagDistribution = RDBWebsitePayload?.flagInfo?.flagDistribution
          if (flagDistribution) {
            const orderedFlags = Object.entries(flagDistribution).sort((flagA, flagB) => flagB[1] - flagA[1])
            if (orderedFlags.length > 0) {
              const topFlagReason = orderedFlags[0][0] as WebsiteFlagReason
              setWebsiteFlagReason(topFlagReason)
              
              const topFlagText = HARMFUL_WEBSITE_REASON_TEXT[topFlagReason]
              setTopWebsiteFlagText(topFlagText)
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
      })()
    }
  }, [currentURL])

  useEffect(() => {
    if (websiteRiskLevel) {
      const shouldTrigger = triggerRiskLevel({
        current: websiteRiskLevel,
        threshold: websiteWarning.warnAt,
      })
      setShouldWarn(shouldTrigger)
      setIsSevere(websiteRiskLevel && [WebsiteRiskLevel.HIGH, WebsiteRiskLevel.SEVERE].includes(websiteRiskLevel))
    }
  }, [websiteRiskLevel])
  
  // Return:
  return shouldWarn && (
    <div
      className={
        cn(
          'fixed z-[0] bottom-0 flex justify-between items-center w-full h-10 px-5 text-lg font-medium',
          isSevere ? 'bg-rose-500 text-white' : 'bg-yellow-300 text-black'
        )
      }
    >
      <TriangleAlertIcon size='20px' color={isSevere ? '#94142A' : '#A48D15'} />
      <span>
        This website has been reported for <span className='font-bold'>{ topWebsiteFlagText }</span> by our users. <a target='_blank' href={`https://openreply.app/flags#${ websiteFlagReason ?? '' }`} className='font-bold'>Learn more</a>.
      </span>
      <XIcon
        size='20px'
        color={isSevere ? 'white' : 'black'}
        className='cursor-pointer'
        onClick={() => setShouldWarn(false)}
      />
    </div>
  )
}

// Exports:
export default WebsiteFlagBanner
