// Packages:
import { useState, useEffect } from 'react'
import { cn } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { getUsernameFromUID } from '../firebase/realtime-database/users/get'
import { useToast } from '../components/ui/use-toast'
import useNotifications from '../hooks/useNotifications'
import { getLastReadNotificationID } from '../firebase/realtime-database/notifications/get'
import { getNotifications } from '../firebase/firestore-database/users/get'
import sleep from 'sleep-promise'
import coalesceNotifications from 'utils/coalesceNotifications'
import {
  cloneDeep,
  // concat,
} from 'lodash'
import logError from 'utils/logError'

// Typescript:
import {
  type Notification as NotificationInterface,
  NotificationAction,
  type NotificationID,
  NotificationType,
} from 'types/notifications'

// Components:
import { ScrollArea } from '../components/ui/scroll-area'
// import ScrollEndObserver from '../components/secondary/ScrollEndObserver'

// Functions:
const Notification = ({
  notification,
}: {
  notification: NotificationInterface & {
    id: NotificationID
    isUnread: boolean
    count: number
  }
}) => {
  // Constants:
  const navigate = useNavigate()
  const { toast } = useToast()

  // Return:
  if (notification.type === NotificationType.Silent) return <></>
  switch (notification.action) {
    case NotificationAction.ShowComment:
      return (
        <div
          className='flex items-start justify-center flex-col gap-2 w-full p-4'
          onClick={() => navigate(`/comment/${notification.payload.URLHash}/${notification.payload.commentID}`)}
        >
          <div className='text-lg font-semibold'>{notification.title}{ notification.count > 1 && ` (${notification.count})` }</div>
          <div className='text-sm text-brand-secondary'>{notification.body}</div>
        </div>
      )
    case NotificationAction.ShowReply:
      return (
        <div
          className='flex items-start justify-center flex-col gap-2 w-full p-4'
          onClick={() => navigate(`/reply/${notification.payload.URLHash}/${notification.payload.commentID}/${notification.payload.replyID}`)}
        >
          <div className='text-lg font-semibold'>{notification.title}{ notification.count > 1 && ` (${notification.count})` }</div>
          <div className='text-sm text-brand-secondary'>{notification.body}</div>
        </div>
      )
    case NotificationAction.CommentReportResult:
      return (
        <div
          className='flex items-start justify-center flex-col gap-2 w-full p-4'
          onClick={() => navigate(`/report/${notification.payload.reportID}`)}
        >
          <div className='text-lg font-semibold'>{notification.title}{ notification.count > 1 && ` (${notification.count})` }</div>
          <div className='text-sm text-brand-secondary'>{notification.body}</div>
        </div>
      )
    case NotificationAction.ReplyReportResult:
      return (
        <div
          className='flex items-start justify-center flex-col gap-2 w-full p-4'
          onClick={() => navigate(`/report/${notification.payload.reportID}`)}
        >
          <div className='text-lg font-semibold'>{notification.title}{ notification.count > 1 && ` (${notification.count})` }</div>
          <div className='text-sm text-brand-secondary'>{notification.body}</div>
        </div>
      )
    case NotificationAction.ShowUser:
      return (
        <div
          className='flex items-start justify-center flex-col gap-2 w-full p-4'
          onClick={async () => {
            try {
              if (!notification.payload.UID) return
              const username = await getUsernameFromUID(notification.payload.UID)
              if (!username) throw Error('User not found!')
              navigate(`/u/${username}`)
            } catch (error) {
              logError({
                functionName: 'Notification.Anonymous',
                data: {
                  notification,
                },
                error,
              })

              toast({
                title: 'User not found!',
                variant: 'destructive',
              })
            }
          }}
        >
          <div className='text-lg font-semibold'>{notification.title}{ notification.count > 1 && ` (${notification.count})` }</div>
          {
            notification.body && (
              <div className='text-sm text-brand-secondary'>{notification.body}</div>
            )
          }
        </div>
      )
    default:
      return <></>
  }
}

const Notifications = () => {
  // Constants:
  const { toast } = useToast()
  const { unreadNotificationCount } = useNotifications()

  // State:
  const [isFetchingNotifications, setIsFetchingNotifications] = useState(false)
  const [lastReadNotificationID, setLastReadNotificationID] = useState<NotificationID | null>(null)
  const [lastVisibleNotificationID, setLastVisibleNotificationID] = useState<NotificationID | null>(null)
  const [notifications, setNotifications] = useState<(NotificationInterface & { id: NotificationID, isUnread: boolean, count: number })[]>([])
  // const [noMoreVisibleNotifications, setNoMoreVisibleNotifications] = useState(false)
  // const [disableScrollEndObserver, setDisableScrollEndObserver] = useState(false)

  // Functions:
  const processRawNotifications = (
    newRawNotifications: (NotificationInterface & {
      id: NotificationID
    })[],
    lastVisibleNotificationID: string | null,
    skipUnreadCheck: boolean = false,
  ) => {
    if (newRawNotifications.length > 0) {
      let hasReachedLastReadNotificationID = false
      const _notifications: ({ id: NotificationID, isUnread: boolean } & NotificationInterface)[] = cloneDeep(notifications)

      if (!skipUnreadCheck) {
        for (const notification of newRawNotifications) {
          if (notification.id === lastVisibleNotificationID) hasReachedLastReadNotificationID = true
          
          if (hasReachedLastReadNotificationID) {
            _notifications.push({
              ...notification,
              isUnread: false,
            })
          } else {
            _notifications.push({
              ...notification,
              isUnread: true,
            })
          }
        }
      } else {
        for (const notification of newRawNotifications) {
          _notifications.push({
            ...notification,
            isUnread: false,
          })
        }
      }

      const _visibleNotifications = _notifications.filter(notification => notification.type === NotificationType.Visible)
      const coalescedNotifications = coalesceNotifications(_visibleNotifications)
      setNotifications(coalescedNotifications)

      return coalescedNotifications
    } else return []
  }

  const fetchInitialNotifications = async () => {
    try {
      if (isFetchingNotifications) return
      setIsFetchingNotifications(true)

      const {
        payload: getLastReadNotificationIDPayload,
        status: getLastReadNotificationIDStatus,
      } = await getLastReadNotificationID()
      if (!getLastReadNotificationIDStatus) throw getLastReadNotificationIDPayload
      setLastReadNotificationID(getLastReadNotificationIDPayload)

      const {
        status: getNotificationsStatus,
        payload: getNotificationsPayload,
      } = await getNotifications({
        lastVisible: getLastReadNotificationIDPayload,
        resetPointer: true,
        limit: 50,
      })
      if (!getNotificationsStatus) throw getNotificationsPayload

      // let _noMoreNotifications = false
      const _lastVisibleID = getNotificationsPayload.lastVisible
      setLastVisibleNotificationID(_lastVisibleID)
      processRawNotifications(getNotificationsPayload.notifications, getNotificationsPayload.lastVisible)
      // const _notifications = processRawNotifications(getNotificationsPayload.notifications, getNotificationsPayload.lastVisible)

      // if (
      //   _lastVisibleID === null ||
      //   _notifications.length === 0
      // ) _noMoreNotifications = true

      // setNoMoreVisibleNotifications(_noMoreNotifications)
    } catch (error) {
      logError({
        functionName: 'Notifications.fetchInitialNotifications',
        data: null,
        error,
      })

      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: "We're currently facing some problems, please try again later!",
      })
    } finally {
      setIsFetchingNotifications(false)
    }
  }

  // const _getNotifications = async () => {
  //   try {
  //     const {
  //       status: getNotificationsStatus,
  //       payload: getNotificationsPayload,
  //     } = await getNotifications({
  //       lastVisible: lastVisibleNotificationID,
  //       limit: 1,
  //     })
  //     if (!getNotificationsStatus) throw getNotificationsPayload
      
  //     let _noMoreNotifications = false
  //     const _lastVisibleID = getNotificationsPayload.lastVisible
  //     setLastVisibleNotificationID(_lastVisibleID)
  //     const _notifications = processRawNotifications(getNotificationsPayload.notifications, getNotificationsPayload.lastVisible)

  //     if (
  //       _lastVisibleID === null ||
  //       _notifications.length === 0
  //     ) _noMoreNotifications = true

  //     setNoMoreVisibleNotifications(_noMoreNotifications)
  //   } catch (error) {
  //     logError({
  //       functionName: 'Notifications._getNotifications',
  //       data: null,
  //       error,
  //     })

  //     toast({
  //       variant: 'destructive',
  //       title: 'Uh oh! Something went wrong.',
  //       description: "We're currently facing some problems, please try again later!",
  //     })
  //   }
  // }

  // const scrollEndReached = async (isVisible: boolean) => {
  //   try {
  //     if (!isVisible || disableScrollEndObserver) return

  //     if (
  //       !noMoreVisibleNotifications &&
  //       !isFetchingNotifications
  //     ) {
  //       setDisableScrollEndObserver(true)
  //       await _getNotifications()
  //     }
  //   } catch (error) {
  //     logError({
  //       functionName: 'Website.scrollEndReached',
  //       data: null,
  //       error,
  //     })
  //   } finally {
  //     setDisableScrollEndObserver(false)
  //   }
  // }

  const reminder = 'for the love of god, fix this fucking thing in the future'

  // Effects:
  // Fetch the initial set of notifications.
  useEffect(() => {
    fetchInitialNotifications()
  }, [])
  
  // Once the first set of notifications have been fetched, visually mark the unread notifications as read.
  useEffect(() => {
    console.log(unreadNotificationCount, notifications.length, notifications, lastReadNotificationID)
    if (
      unreadNotificationCount === 0 &&
      notifications.length > 0 &&
      lastReadNotificationID !== notifications[0].id
    ) {
      (async () => {
        await sleep(2000)
        setLastReadNotificationID(notifications[0].id)
        processRawNotifications(notifications, notifications[0].id, true)
      })()
    }
  }, [
    unreadNotificationCount,
    notifications,
    lastReadNotificationID,
  ])

  // Return:
  return (
    <main className='w-full pt-[68px] bg-white text-brand-primary' style={{ height: 'calc(100% - 68px)' }}>
      {
        isFetchingNotifications ? 'Loading..' : (
          <ScrollArea className='w-full h-screen' hideScrollbar>
            <div className='flex flex-col gap-4 w-full px-4 pt-7 pb-16'>
              {
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      'w-full light:brightness-95 dark:hover:brightness-105 transition-all',
                      notification.isUnread && 'bg-red',
                    )}
                  >
                    <Notification notification={notification} />
                  </div>
                ))
              }
            </div>
            {/* <ScrollEndObserver
              setIsVisible={scrollEndReached}
              disabled={disableScrollEndObserver}
            /> */}
          </ScrollArea>
        )
      }
    </main>
  )
}

// Exports:
export default Notifications
