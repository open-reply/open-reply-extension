/// <reference types='chrome' />

// Packages:
import {
  _authenticateWithEmailAndPassword,
  _authenticateWithGoogle,
  _getCurrentUser,
} from './firebase/auth'
import {
  _checkCommentForHateSpeech,
  _getComments,
  _getCommentSnapshot,
  _getUserComments,
} from './firebase/firestore-database/comment/get'
import {
  _addComment,
  _bookmarkComment,
  _deleteComment,
  _downvoteComment,
  _editComment,
  _notInterestedInComment,
  _reportComment,
  _upvoteComment,
} from './firebase/firestore-database/comment/set'
import {
  _checkReplyForHateSpeech,
  _getReplies,
  _getReplySnapshot,
  _getUserReplies,
} from './firebase/firestore-database/reply/get'
import {
  _addReply,
  _bookmarkReply,
  _deleteReply,
  _downvoteReply,
  _editReply,
  _reportReply,
  _upvoteReply,
} from './firebase/firestore-database/reply/set'
import {
  _getFirestoreReportSnapshot,
} from './firebase/firestore-database/reports/get'
import {
  _getCommentBookmarks,
  _getFirestoreUserSnapshot,
  _getFlatReports,
  _getFollowers,
  _getFollowing,
  _getNotifications,
  _getReplyBookmarks,
  _getUserFlatComments,
  _getUserFlatReplies,
  _getWebsiteBookmarks,
  _listenForNotifications,
  _unsubscribeToNotifications,
} from './firebase/firestore-database/user/get'
import {
  _followUser,
  _removeFollower,
  _unfollowUser,
} from './firebase/firestore-database/user/set'
import {
  _getUserPreferences,
} from './firebase/firestore-database/user-preferences/get'
import {
  _setUserPreferences,
} from './firebase/firestore-database/user-preferences/set'
import {
  _getFirestoreWebsiteSnapshot,
} from './firebase/firestore-database/website/get'
import {
  _bookmarkWebsite,
  _downvoteWebsite,
  _flagWebsite,
  _indexWebsite,
  _upvoteWebsite,
} from './firebase/firestore-database/website/set'
import {
  _isCommentBookmarked,
} from './firebase/realtime-database/comment/get'
import {
  _getAllMutedUsers,
} from './firebase/realtime-database/muted/get'
import {
  _muteUser,
  _unmuteUser,
} from './firebase/realtime-database/muted/set'
import {
  _getRecentActivityFromUser,
} from './firebase/realtime-database/recentActivity/get'
import {
  _isReplyBookmarked,
} from './firebase/realtime-database/reply/get'
import {
  _getUserTaste,
  _getUserTopicTasteScore,
} from './firebase/realtime-database/tastes/get'
import {
  _getTopicCommentScores,
} from './firebase/realtime-database/topics/get'
import {
  _getRDBUser,
  _getRDBUserSnapshot,
  _isUsernameTaken,
} from './firebase/realtime-database/users/get'
import {
  _updateRDBUser,
  _updateRDBUserFullName,
  _updateRDBUsername,
} from './firebase/realtime-database/users/set'
import {
  _getRDBWebsite,
  _getRDBWebsiteCommentCount,
  _getRDBWebsiteFlagCount,
  _getRDBWebsiteFlagDistribution,
  _getRDBWebsiteFlagDistributionReasonCount,
  _getRDBWebsiteFlagsCumulativeWeight,
  _getRDBWebsiteImpressions,
} from './firebase/realtime-database/website/get'
import {
  _incrementWebsiteImpression,
} from './firebase/realtime-database/website/set'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

// Typescript:
import type { AuthStateBroadcastPayload, SubscriptionType } from 'types/internal-messaging'

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from '@/constants/internal-messaging'

// Exports:
export default defineBackground(() => {
  let subscriptions: Partial<Record<SubscriptionType, { tabIDs: Set<number>, unsubscribe: () => void }>> = {}

  const broadcast = <T>(event: { type: SubscriptionType, payload: T }) => {
    if (subscriptions[event.type]) {
      subscriptions[event.type]?.tabIDs.forEach(tabID => {
        chrome.tabs.sendMessage(
          tabID,
          {
            type: INTERNAL_MESSAGE_ACTIONS.GENERAL.ON_EVENT,
            subscriptionType: event.type,
            payload: event.payload,
          }
        )
      })
    }
  }

  chrome.tabs.onRemoved.addListener(tabID => {
    for (let subscriptionType in subscriptions) {
      subscriptions[subscriptionType as SubscriptionType]?.tabIDs.delete(tabID)
      if (subscriptions[subscriptionType as SubscriptionType]?.tabIDs.size === 0) {
        const unsubscribe = subscriptions[subscriptionType as SubscriptionType]?.unsubscribe
        if (unsubscribe) unsubscribe()
        delete subscriptions[subscriptionType as SubscriptionType]
      }
    }
  })

  browser.action.onClicked.addListener(() => {
    console.log('Toggling OpenReply..')
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: INTERNAL_MESSAGE_ACTIONS.GENERAL.TOGGLE, payload: null })
      }
    })
  })

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
      // General:
      case INTERNAL_MESSAGE_ACTIONS.GENERAL.TAKE_SCREENSHOT:
        chrome.tabs.captureVisibleTab({ format: 'png' }, dataURL => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError)
            sendResponse(chrome.runtime.lastError.message)
          } else {
            sendResponse(dataURL)
          }
        })
        return true
      
      // Auth:
      case INTERNAL_MESSAGE_ACTIONS.AUTH.AUTHENTICATE:
        _authenticateWithEmailAndPassword(request.payload).then(sendResponse)
        return true
      case INTERNAL_MESSAGE_ACTIONS.AUTH.AUTHENTICATE_WITH_GOOGLE:
        _authenticateWithGoogle().then(sendResponse)
        return true
      case INTERNAL_MESSAGE_ACTIONS.AUTH.GET_CURRENT_USER:
        _getCurrentUser().then(sendResponse)
        return true

      // Firestore Database:
        // Comment:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getComments:
          _getComments(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getUserComments:
          _getUserComments(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getCommentSnapshot:
          _getCommentSnapshot(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.checkCommentForHateSpeech:
          _checkCommentForHateSpeech(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.addComment:
          _addComment(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.deleteComment:
          _deleteComment(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.editComment:
          _editComment(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.reportComment:
          _reportComment(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.upvoteComment:
          _upvoteComment(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.downvoteComment:
          _downvoteComment(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.notInterestedInComment:
          _notInterestedInComment(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.set.bookmarkComment:
          _bookmarkComment(request.payload).then(sendResponse)
          return true
      
        // Reply:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getReplies:
          _getReplies(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getUserReplies:
          _getUserReplies(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getReplySnapshot:
          _getReplySnapshot(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.checkReplyForHateSpeech:
          _checkReplyForHateSpeech(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.addReply:
          _addReply(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.deleteReply:
          _deleteReply(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.editReply:
          _editReply(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.reportReply:
          _reportReply(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.upvoteReply:
          _upvoteReply(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.downvoteReply:
          _downvoteReply(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.set.bookmarkReply:
          _bookmarkReply(request.payload).then(sendResponse)
          return true

        // Reports:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reports.get.getFirestoreReportSnapshot:
          _getFirestoreReportSnapshot(request.payload).then(sendResponse)
          return true

        // User:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFirestoreUserSnapshot:
          _getFirestoreUserSnapshot(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getUserFlatComments:
          _getUserFlatComments(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getUserFlatReplies:
          _getUserFlatReplies(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getNotifications:
          _getNotifications(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFlatReports:
          _getFlatReports(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFollowers:
          _getFollowers(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getFollowing:
          _getFollowing(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getWebsiteBookmarks:
          _getWebsiteBookmarks(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getCommentBookmarks:
          _getCommentBookmarks(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.getReplyBookmarks:
          _getReplyBookmarks(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.listenForNotifications:
          _listenForNotifications(sender, subscriptions, broadcast).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.get.unsubscribeToNotifications:
          _unsubscribeToNotifications(sender, subscriptions).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.followUser:
          _followUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.unfollowUser:
          _unfollowUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.user.set.removeFollower:
          _removeFollower(request.payload).then(sendResponse)
          return true

        // User Preferences:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.userPreferences.get.getUserPreferences:
          _getUserPreferences(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.userPreferences.set.setUserPreferences:
          _setUserPreferences(request.payload).then(sendResponse)
          return true
        
        // Website:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.get.getFirestoreWebsiteSnapshot:
          _getFirestoreWebsiteSnapshot(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.set.indexWebsite:
          _indexWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.set.flagWebsite:
          _flagWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.set.upvoteWebsite:
          _upvoteWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.set.downvoteWebsite:
          _downvoteWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.website.set.bookmarkWebsite:
          _bookmarkWebsite(request.payload).then(sendResponse)
          return true

      // Realtime Database:
        // Comment:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.comment.get.isCommentBookmarked:
          _isCommentBookmarked(request.payload).then(sendResponse)
          return true

        // Muted:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.get.getAllMutedUsers:
          _getAllMutedUsers().then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.set.muteUser:
          _muteUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.muted.set.unmuteUser:
          _unmuteUser(request.payload).then(sendResponse)
          return true

        // Recent Activity:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.recentActivity.get.getRecentActivityFromUser:
          _getRecentActivityFromUser(request.payload).then(sendResponse)
          return true

        // Reply:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.reply.get.isReplyBookmarked:
          _isReplyBookmarked(request.payload).then(sendResponse)
          return true
        
        // Tastes:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.tastes.get.getUserTaste:
          _getUserTaste().then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.tastes.get.getUserTopicTasteScore:
          _getUserTopicTasteScore(request.payload).then(sendResponse)
          return true

        // Topics:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.topics.get.getTopicCommentScores:
          _getTopicCommentScores(request.payload).then(sendResponse)
          return true

        // Users:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUserSnapshot:
          _getRDBUserSnapshot(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.getRDBUser:
          _getRDBUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.get.isUsernameTaken:
          _isUsernameTaken(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUser:
          _updateRDBUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUsername:
          _updateRDBUsername(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUserFullName:
          _updateRDBUserFullName(request.payload).then(sendResponse)
          return true
        
        // Website:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsite:
          _getRDBWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteImpressions:
          _getRDBWebsiteImpressions(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagDistribution:
          _getRDBWebsiteFlagDistribution(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagDistributionReasonCount:
          _getRDBWebsiteFlagDistributionReasonCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagsCumulativeWeight:
          _getRDBWebsiteFlagsCumulativeWeight(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteFlagCount:
          _getRDBWebsiteFlagCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.get.getRDBWebsiteCommentCount:
          _getRDBWebsiteCommentCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.website.set.incrementWebsiteImpression:
          _incrementWebsiteImpression(request.payload).then(sendResponse)
          return true
    }
  })

  onAuthStateChanged(auth, async user => {
    const authStateChangedPayload = {
      isLoading: false,
    } as AuthStateBroadcastPayload
    if (user) {
      const UID = user.uid        
      const photoURL = user.photoURL ? user.photoURL : null
      const { status, payload } = await _getRDBUser({ UID })

      if (status) {
        if (
          payload !== null &&
          payload.username &&
          payload.fullName
        ) {
          authStateChangedPayload.isAccountFullySetup = true
          authStateChangedPayload.user = {
            ...user,
            username: payload.username,
            fullName: payload.fullName,
            verification: payload.verification,
            photoURL,
          }
          authStateChangedPayload.isSignedIn = true
        } else {
          authStateChangedPayload.isAccountFullySetup = false
          authStateChangedPayload.user = {
            ...user,
            username: payload?.username,
            fullName: payload?.fullName,
            verification: payload?.verification,
            photoURL,
          }
          authStateChangedPayload.toast = {
            title: 'Please finish setting up your profile!',
          }
          authStateChangedPayload.isSignedIn = true
        }
      } else {
        authStateChangedPayload.isAccountFullySetup = false
        authStateChangedPayload.user = {
          ...user,
          photoURL,
        }
        authStateChangedPayload.toast = {
          title: 'Please finish setting up your profile!',
        }
        authStateChangedPayload.isSignedIn = true
      }
    } else {
      authStateChangedPayload.user = null
      authStateChangedPayload.isSignedIn = false
    }

    chrome.tabs.query({}, tabs => {
      for (const tab of tabs) {
        if (tab.id) chrome.tabs.sendMessage(tab.id, {
          type: INTERNAL_MESSAGE_ACTIONS.AUTH.AUTH_STATE_CHANGED,
          payload: authStateChangedPayload,
        })
      }
    })
  })
})
