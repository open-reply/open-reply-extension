/// <reference types='chrome' />

// Packages:
import {
  _authenticateWithEmailAndPassword,
  _authenticateWithGoogle,
  _getCurrentUser,
  _getAuthState,
  _logout,
  _sendVerificationEmail,
} from './firebase/auth'
import {
  _checkCommentForHateSpeech,
  _getComments,
  _getComment,
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
  _getReply,
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
  _getFirestoreReport,
} from './firebase/firestore-database/reports/get'
import {
  _getCommentBookmarks,
  _getFirestoreUser,
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
} from './firebase/firestore-database/users/get'
import {
  _followUser,
  _removeFollower,
  _setUserDateOfBirth,
  _setUserURLs,
  _unfollowUser,
} from './firebase/firestore-database/users/set'
import {
  _getUserPreferences,
} from './firebase/firestore-database/user-preferences/get'
import {
  _setUserPreferences,
} from './firebase/firestore-database/user-preferences/set'
import {
  _getFirestoreWebsite,
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
  _isUsernameTaken,
} from './firebase/realtime-database/users/get'
import {
  _updateRDBUser,
  _updateRDBUserBio,
  _updateRDBUserFullName,
  _updateRDBUsername,
} from './firebase/realtime-database/users/set'
import {
  _getCommentVote,
  _getReplyVote,
  _getWebsiteVote,
} from './firebase/realtime-database/votes/get'
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
import {
  _setUserProfilePicture,
} from './firebase/storage/users/set'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import returnable from 'utils/returnable'

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
            sendResponse(returnable.fail(chrome.runtime.lastError.message))
          } else {
            sendResponse(returnable.success(dataURL))
          }
        })
        return true
      case INTERNAL_MESSAGE_ACTIONS.GENERAL.GET_FAVICON:
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError)
            sendResponse(returnable.fail(chrome.runtime.lastError.message))
          } else {
            if (tabs[0]) {
              let tab = tabs[0]
              let faviconURL = tab.favIconUrl
              sendResponse(returnable.success(faviconURL))
            }
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
      case INTERNAL_MESSAGE_ACTIONS.AUTH.GET_AUTH_STATE:
        _getAuthState().then(sendResponse)
        return true
      case INTERNAL_MESSAGE_ACTIONS.AUTH.LOGOUT:
        _logout().then(sendResponse)
        return true
      case INTERNAL_MESSAGE_ACTIONS.AUTH.SEND_VERIFICATION_EMAIL:
        _sendVerificationEmail().then(sendResponse)
        return true

      // Firestore Database:
        // Comment:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getComments:
          _getComments(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getUserComments:
          _getUserComments(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.comment.get.getComment:
          _getComment(request.payload).then(sendResponse)
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
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reply.get.getReply:
          _getReply(request.payload).then(sendResponse)
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
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.reports.get.getFirestoreReport:
          _getFirestoreReport(request.payload).then(sendResponse)
          return true

        // User:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFirestoreUser:
          _getFirestoreUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getUserFlatComments:
          _getUserFlatComments(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getUserFlatReplies:
          _getUserFlatReplies(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getNotifications:
          _getNotifications(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFlatReports:
          _getFlatReports(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFollowers:
          _getFollowers(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getFollowing:
          _getFollowing(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getWebsiteBookmarks:
          _getWebsiteBookmarks(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getCommentBookmarks:
          _getCommentBookmarks(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.getReplyBookmarks:
          _getReplyBookmarks(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.listenForNotifications:
          _listenForNotifications(sender, subscriptions, broadcast).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.get.unsubscribeToNotifications:
          _unsubscribeToNotifications(sender, subscriptions).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.followUser:
          _followUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.unfollowUser:
          _unfollowUser(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.removeFollower:
          _removeFollower(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.setUserURLs:
          _setUserURLs(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.users.set.setUserDateOfBirth:
          _setUserDateOfBirth(request.payload).then(sendResponse)
          return true

        // User Preferences:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.userPreferences.get.getUserPreferences:
          _getUserPreferences(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.userPreferences.set.setUserPreferences:
          _setUserPreferences(request.payload).then(sendResponse)
          return true
        
        // Website:
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.get.getFirestoreWebsite:
          _getFirestoreWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.indexWebsite:
          _indexWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.flagWebsite:
          _flagWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.upvoteWebsite:
          _upvoteWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.downvoteWebsite:
          _downvoteWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.FIRESTORE_DATABASE.websites.set.bookmarkWebsite:
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
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.users.set.updateRDBUserBio:
          _updateRDBUserBio(request.payload).then(sendResponse)
          return true

        // Votes:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.votes.get.getWebsiteVote:
          _getWebsiteVote(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.votes.get.getCommentVote:
          _getCommentVote(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.votes.get.getReplyVote:
          _getReplyVote(request.payload).then(sendResponse)
          return true
        
        // Website:
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsite:
          _getRDBWebsite(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteImpressions:
          _getRDBWebsiteImpressions(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagDistribution:
          _getRDBWebsiteFlagDistribution(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagDistributionReasonCount:
          _getRDBWebsiteFlagDistributionReasonCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagsCumulativeWeight:
          _getRDBWebsiteFlagsCumulativeWeight(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteFlagCount:
          _getRDBWebsiteFlagCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.get.getRDBWebsiteCommentCount:
          _getRDBWebsiteCommentCount(request.payload).then(sendResponse)
          return true
        case INTERNAL_MESSAGE_ACTIONS.REALTIME_DATABASE.websites.set.incrementWebsiteImpression:
          _incrementWebsiteImpression(request.payload).then(sendResponse)
          return true
    
      // Storage:
        // User:
        case INTERNAL_MESSAGE_ACTIONS.STORAGE.users.set.setUserProfilePicture:
          _setUserProfilePicture(request.payload).then(sendResponse)
          return true
    }
  })

  onAuthStateChanged(auth, async user => {
    const authStateChangedPayload = {
      isLoading: false,
    } as AuthStateBroadcastPayload
    try {
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
    } catch (error) {
      chrome.tabs.query({}, tabs => {
        for (const tab of tabs) {
          if (tab.id) chrome.tabs.sendMessage(tab.id, {
            type: INTERNAL_MESSAGE_ACTIONS.AUTH.AUTH_STATE_CHANGED,
            payload: authStateChangedPayload,
          })
        }
      })
    }
  })
})
