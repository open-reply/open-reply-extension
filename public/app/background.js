/*global chrome*/
/*global firebase*/

// Initialization:
const firebaseConfig = {
  apiKey: "AIzaSyDQhDVouDQC-DLG4hojVk7tgr7JTy-8Y_g",
  authDomain: "open-reply.firebaseapp.com",
  databaseURL: "https://open-reply.firebaseio.com",
  projectId: "open-reply",
  storageBucket: "open-reply.appspot.com",
  messagingSenderId: "753239720595",
  appId: "1:753239720595:web:f17885cbfebf40bc778366",
  measurementId: "G-LWBDTCVZTR"
};

firebase.initializeApp(firebaseConfig);


// Constants:
const AUTH = firebase.auth();
const REALTIME = firebase.database();
const STORAGE = firebase.firestore();
const DATABASE = {
  REALTIME,
  STORAGE
};
const BUCKET = firebase.storage().ref();
const PLANS = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
  GOLD: 'GOLD'
};
const QUOTA = {
  [ PLANS.FREE ]: {
    URLs: 10 ,
    comments: 20,
    replies: 20
  },
  [ PLANS.PREMIUM ]: {
    URLs: 25,
    comments: 50,
    replies: 50,
  },
  [ PLANS.GOLD ]: {
    URLs: 50,
    comments: 100,
    replies: 100,
  }
};
const URLS_REF = 'URLs/';
const COMMENTS_REF = 'comments/';
const REPLIES_REF = 'replies/';
const DATABASE_CONSTANTS = {
  REALTIME: {
    GLOBALS_REF: {
      URL_COUNT: 'global/URLCount',
      COMMENT_COUNT: 'global/commentCount',
      REPLY_COUNT: 'global/replyCount',
    },
    URLS_REF,
    COMMENTS_REF,
    REPLIES_REF,
    VOTES_REF: {
      URLS: 'votes/' + URLS_REF,
      COMMENTS: 'votes/' + COMMENTS_REF,
      REPLIES: 'votes/' + REPLIES_REF,
    },
    FLAGS_REF: {
      URLS: 'flags/' + URLS_REF,
      COMMENTS: 'flags/' + COMMENTS_REF,
      REPLIES: 'flags/' + REPLIES_REF,
    }
  },
  STORAGE: {
    USERS_COLLECTION: 'users',
    URLS_COLLECTION: 'URLs',
    COMMENTS_COLLECTION: 'comments',
    REPLIES_COLLECTION: 'replies',
  }
};
const USERS_REF = 'users/';
const RESULTS = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};
const UPVOTE = 1;
const NOVOTE = 0;
const DOWNVOTE = -1;
const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;
let user = null;

// const ACTION = {
//   TYPES: [ 'READ', 'WRITE' ],
//   READ: 'READ',
//   WRITE: 'WRITE',
//   TARGETS: [ 'URL', 'TEXT', 'VOTE', 'OPTIONS' ],
//   URL: 'URL',
//   TEXT: 'TEXT',
//   VOTE: 'VOTE',
//   OPTIONS: 'OPTIONS'
// };
// const SPAM = {
//   warnThreshold: 3,
//   banThreshold: 5,
//   maxDelta: 1000 * 30,
//   maxDuplicatesWarning: 7,
//   maxDuplicatesBan: 12
// };
// const SPAM_STRIKE = {
//   READ: {
//     URL: 0,
//     TEXT: 0,
//     VOTE: 0,
//     OPTIONS: 0
//   },
//   WRITE: {
//     URL: 0,
//     TEXT: 0,
//     VOTE: 0,
//     OPTIONS: 0
//   },
// };
// let actions = {
//   READ: {
//     URL: {
//       history: [],
//       lastModified: null,
//       delta: null
//     },
//     TEXT: {
//       history: [],
//       lastModified: null,
//       delta: null
//     },
//     VOTE: {
//       history: [],
//       lastModified: null,
//       delta: null
//     },
//     OPTIONS: {
//       history: [],
//       lastModified: null,
//       delta: null
//     }
//   },
//   WRITE: {
//     URL: {
//       history: [],
//       lastModified: null,
//       delta: null
//     },
//     TEXT: {
//       history: [],
//       lastModified: null,
//       delta: null
//     },
//     VOTE: {
//       history: [],
//       lastModified: null,
//       delta: null
//     },
//     OPTIONS: {
//       history: [],
//       lastModified: null,
//       delta: null
//     }
//   },
//   lastModified: null,
//   delta: null
// };


// Listeners:
chrome.browserAction.onClicked.addListener(() => {
	console.log('Toggling OpenReply..');
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs[0].id !== undefined) {
			chrome.tabs.sendMessage(tabs[0].id, { type: 'B2C_TOGGLE_VISIBILITY', payload: null });
		}
	});
});

chrome.commands.onCommand.addListener((command) => {
  console.log('Toggling OpenReply..');
  if (command === 'toggle-open-reply') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id !== undefined) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'B2C_TOGGLE_VISIBILITY', payload: null });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch(message.type) {
    case 'C2B_TOGGLE_VISIBILITY':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id !== undefined) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'B2C_TOGGLE_VISIBILITY', payload: message.payload });
        }
      });
      break;
    case 'REGISTER':
      handleAuth.register(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'LOGIN':
      handleAuth.login(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'LOGOUT':
      handleAuth.logout().then((response) => {
        sendResponse(response);
      });
      break;
    case 'GET_AUTH_STATE':
      sendResponse({ result: RESULTS.SUCCESS, payload: user });
      break;
    case 'UPDATE_USER':
      handleAuth.updateUser(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'REAUTHENTICATE_USER':
      handleAuth.reAuthenticateUser(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'VERIFY_USER_EMAIL':
      handleAuth.verifyUserEmail().then((response) => {
        sendResponse(response);
      });
      break;
    case 'UPDATE_USER_PASSWORD':
      handleAuth.updateUserPassword(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'RESET_USER_PASSWORD':
      handleAuth.resetUserPassword(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'UPLOAD_PROFILE_PICTURE':
      handleBucket.uploadProfilePicture(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'DOWNLOAD_PROFILE_PICTURE':
      handleBucket.downloadProfilePicture(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'ADD_USER':
      handleDatabase.addUser(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'UPDATE_BABYMODE':
      handleDatabase.updateBabyMode(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'POST_COMMENT':
      handleDatabase.postComment(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'POST_REPLY':
      handleDatabase.postReply(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'LOAD_URL_DETAILS':
      handleDatabase.loadURLDetails(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'LOAD_COMMENT_DETAILS':
      handleDatabase.loadCommentDetails(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'LOAD_REPLY_DETAILS':
      handleDatabase.loadReplyDetails(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'VOTE_URL':
      handleDatabase.voteURL(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'VOTE_COMMENT':
      handleDatabase.voteComment(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'VOTE_REPLY':
      handleDatabase.voteReply(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'FLAG_URL':
      handleDatabase.flagURL(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'FLAG_COMMENT':
      handleDatabase.flagComment(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'FLAG_REPLY':
      handleDatabase.flagReply(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'DELETE_COMMENT':
      handleDatabase.deleteComment(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    case 'DELETE_REPLY':
      handleDatabase.deleteReply(message.payload).then((response) => {
        sendResponse(response);
      });
      break;
    default:
      sendResponse({ result: RESULTS.FAILURE, payload: { code: 'invalid-type', message: `An invalid message type was used when the content script tried to talk to the background script. The type is ${ message.type }` } });
      break;
  }
  // From the docs: "In the above example, sendResponse was called synchronously.
  // If you want to asynchronously use sendResponse, add return true; to the onMessage event handler."
  // Source: https://developer.chrome.com/extensions/messaging
  return true;
});

AUTH.onAuthStateChanged(async (authUser) => {
  user = authUser;
  chrome.tabs.query({}, (tabs) => {
    for (let i = 0; i < tabs.length; i++) {
      chrome.tabs.sendMessage(tabs[i].id, { type: 'AUTH_STATE_CHANGED', payload: user });
    }
  });
});


// Functions:
const handleAuth = {
  register: async (props) => {
    try {
      const usernameInUse = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.username).get()).exists;
      if (!usernameInUse) {
        const signInMethods = await AUTH.fetchSignInMethodsForEmail(props.email);
        if (signInMethods.length === 0) {
          const userCredential = await AUTH.createUserWithEmailAndPassword(props.email, props.password);
          await userCredential.user.updateProfile({
            displayName: props.username
          });
          await userCredential.user.sendEmailVerification();
          await AUTH.signOut();
          return { result: RESULTS.SUCCESS, payload: userCredential.user };
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'email-in-use', message: 'Email address is already in use.' } };
        }
      }
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  login: async (props) => {
    try {
      const userCredential = await AUTH.signInWithEmailAndPassword(props.email, props.password);
      const loginUser = userCredential.user;
      if (loginUser !== null) {
        if (loginUser.emailVerified && loginUser.displayName !== null) {
          return { result: RESULTS.SUCCESS, payload: loginUser };
        } else {
          await AUTH.signOut();
          return { result: RESULTS.FAILURE, payload: { code: 'email-not-verified', message: 'Email is not verified.' } };
        }
      } else {
        return { result: RESULTS.FAILURE, payload: { code: 'null-user', message: 'Firebase User from User Credential is null.' } };
      }
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  logout: async () => {
    try {
      await AUTH.signOut();
      return { result: RESULTS.SUCCESS, payload: null };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  updateUser: async (props) => {
    try {
      if (props.username && props.photoURL) {
        await AUTH.currentUser.updateProfile({
          displayName: props.username,
          photoURL: props.photoURL,
        });
      } else if (props.username) {
        await AUTH.currentUser.updateProfile({
          displayName: props.username
        });
      } else if (props.photoURL) {
        await AUTH.currentUser.updateProfile({
          photoURL: props.photoURL
        });
      }
      return { result: RESULTS.SUCCESS, payload: null };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  reAuthenticateUser: async (props) => {
    try {
      const credentials = firebase.auth.EmailAuthProvider.credential(
        AUTH.currentUser.email,
        props.password
      );  
      const userCredential = await AUTH.currentUser.reauthenticateWithCredential(credentials);
      return { result: RESULTS.SUCCESS, payload: userCredential };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  verifyUserEmail: async () => {
    try {
      await AUTH.currentUser.sendEmailVerification();
      return { result: RESULTS.SUCCESS, payload: null };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  updateUserPassword: async (props) => {
    try {
      await AUTH.currentUser.updatePassword(props.newPassword);
      return { result: RESULTS.SUCCESS, payload: null };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  resetUserPassword: async (props) => {
    try {
      await AUTH.sendPasswordResetEmail(props.emailAddress);
      return { result: RESULTS.SUCCESS, payload: null };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
};

const handleBucket = {
  uploadProfilePicture: async (props) => {
    try {
      let [ result, payload ] = [ RESULTS.SUCCESS, null ];
      const uploadTask = BUCKET.child(USERS_REF + props.authUser.UID + '/profilePicture').putString(props.dataURL, 'data_url', { cacheControl: 'private, max-age=2592000' });
      uploadTask.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        null,
        (e) => [ result, payload ] = [ RESULTS.FAILURE, e ],
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          const { result: updateUserResult, payload: updateUserPayload } = await handleAuth.updateUser({ photoURL: downloadURL });
          if (updateUserResult === RESULTS.FAILURE) {
            [ result, payload ] = [ RESULTS.FAILURE, updateUserPayload ];
          } else {
            chrome.tabs.query({}, (tabs) => {
              for (let i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, { type: 'AUTH_STATE_CHANGED', payload: AUTH.currentUser });
              }
            });
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0].id !== undefined) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'PROFILE_PICTURE_UPLOADED', payload: null });
              }
            });
          }
        }
      );
      return { result, payload };
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  downloadProfilePicture: async (props) => {
    try {
      const downloadURL = await BUCKET.child(USERS_REF + props.UID + '/profilePicture').getDownloadURL();
      return { result: RESULTS.SUCCESS, payload: downloadURL };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  }
};

const handleDatabase = {
  addUser: async (props) => {
    try {
      // Server operation.
      await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.username).set({
        babyMode: true,
        UID: props.UID,
        URLs: [],
        comments: [],
        replies: [],
        votes: [],
        totalURLs: 0,
        totalComments: 0,
        totalReplies: 0,
        totalVotes: 0,
        createdOn: firebase.firestore.FieldValue.serverTimestamp(),
        quota: {
          URLs: 0,
          comments: 0,
          replies: 0,
          endTime: 0
        },
        plan: PLANS.FREE
      });
      return { result: RESULTS.SUCCESS, payload: null };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  updateBabyMode: async (props) => {
    try {
      await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.username).update({
        babyMode: props.newMode
      });
      return { result: RESULTS.SUCCESS, payload: null };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  postComment: async (props) => {
    try {
      // Check if this user can comment.
      const currentTime = Date.now();
      const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).get()).data();
      if (userOptions.totalURLs === undefined) {
        // Update user object to the latest version.
        await updateUserObject({ username: props.authUser.username, quota: { comments: 1 } });
      }
      if (userOptions.quota.endTime <= currentTime) {
        // Period is over. Set new endTime period and reset quota values.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          quota: {
            URLs: 0,
            comments: 1,
            replies: 0,
            endTime: currentTime + TWENTY_FOUR_HOURS
          }
        });
        userOptions.quota.URLs = 0;
        userOptions.quota.endTime = currentTime + TWENTY_FOUR_HOURS;
      } else if (userOptions.quota.endTime >= currentTime && userOptions.quota.comments < QUOTA[ userOptions.plan ].comments) {
        // Period is not over but it's below the quota.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          'quota.comments': firebase.firestore.FieldValue.increment(1)
        });
      } else {
        // Period not over but above quota.
        return { result: RESULTS.FAILURE, payload: { code: 'above-quota', message: 'Your comment quota for today is full. You can wait or purchase a higher plan.' } };
      }
      const batchedUpdates = {};
      if (!(await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).get()).exists) {
        // If URLID doesn't already exist, create it and increase the counter. Advertise this counter on the website.
        if (userOptions.quota.endTime >= currentTime && userOptions.quota.URLs < QUOTA[ userOptions.plan ].URLs) {
          // Period is not over but it's below the quota.
          await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
            'quota.URLs': firebase.firestore.FieldValue.increment(1)
          });
        } else {
          // Period not over but above quota.
          return { result: RESULTS.FAILURE, payload: { code: 'above-quota', message: 'Your website quota for today is full. You can wait or purchase a higher plan.' } };
        }
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).set({
          createdBy: props.authUser.username,
          createdOn: firebase.firestore.FieldValue.serverTimestamp(),
          link: props.link,
          title: props.title,
          favicon: props.favicon,
          totalComments: 1,
          totalSentiment: props.sentiment,
          upVotes: 0,
          downVotes: 0,
          totalVote: 0,
          flagged: false,
          flagCount: 0,
        });
        batchedUpdates[ DATABASE_CONSTANTS.REALTIME.GLOBALS_REF.URL_COUNT ] = firebase.database.ServerValue.increment(1);
        // Update the user's URLs array and totalURLs count.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          URLs: firebase.firestore.FieldValue.arrayUnion(props.URLID),
          totalURLs: firebase.firestore.FieldValue.increment(1)
        });
        // Update the user's comments array and totalComments count.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          comments: firebase.firestore.FieldValue.arrayUnion(props.ID),
          totalComments: firebase.firestore.FieldValue.increment(1)
        });
      } else {
        // URLID already exists. Update the counter.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).update({
          totalComments: firebase.firestore.FieldValue.increment(1),
          totalSentiment: firebase.firestore.FieldValue.increment(props.sentiment),
        });
        // Update the user's comments array and totalComments count.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          comments: firebase.firestore.FieldValue.arrayUnion(props.ID),
          totalComments: firebase.firestore.FieldValue.increment(1)
        });
      }
      // Add the comment.
      const commentObj = {
        deleted: false,
        author: props.authUser.username,
        authorUID: props.authUser.UID,
        createdOn: firebase.firestore.FieldValue.serverTimestamp(),
        body: props.body,
        totalReplies: 0,
        upVotes: 0,
        downVotes: 0,
        totalVote: 0,
        sentiment: props.sentiment,
        flagged: props.profanity,
        flagCount: props.profanity ? 1 : 0,
      };
      await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).set(commentObj);
      batchedUpdates[ DATABASE_CONSTANTS.REALTIME.GLOBALS_REF.COMMENT_COUNT ] = firebase.database.ServerValue.increment(1);
      await DATABASE.REALTIME.ref().update(batchedUpdates);
      return {
        result: RESULTS.SUCCESS,
        payload: {
          ID: props.ID,
          userVote: 0,
          ...commentObj,
          createdOn: Date.now(),
        }
      };
    } catch(e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  postReply: async (props) => {
    try {
      // Check if this user can comment.
      const currentTime = Date.now();
      const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).get()).data();
      if (userOptions.totalReplies === undefined) {
        // Update user object to the latest version.
        await updateUserObject({ username: props.authUser.username, quota: { replies: 1 } });
      }
      if (userOptions.quota.endTime <= currentTime) {
        // Period is over. Set new endTime period and reset quota values.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          quota: {
            URLs: 0,
            comments: 0,
            replies: 1,
            endTime: currentTime + TWENTY_FOUR_HOURS
          }
        });
      } else if (userOptions.quota.endTime >= currentTime && userOptions.quota.replies < QUOTA[ userOptions.plan ].replies) {
        // Period is not over but it's below the quota.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          'quota.replies': firebase.firestore.FieldValue.increment(1)
        });
      } else {
        // Period not over but above quota.
        return { result: RESULTS.FAILURE, payload: { code: 'above-quota', message: 'Your reply quota for today is full. You can wait or purchase a higher plan.' } };
      }
      // Check if comment exists and isn't earmarked for deletion.
      const commentSnapshot = await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID).get();
      const commentExists = commentSnapshot.exists;
      const commentObject = commentSnapshot.data();
      if (commentExists && commentObject !== undefined) {
        if (!commentObject.deleted) {
          // Add the reply.
          const replyObj = {
            author: props.authUser.username,
            authorUID: props.authUser.UID,
            createdOn: firebase.firestore.FieldValue.serverTimestamp(),
            body: props.body,
            upVotes: 0,
            downVotes: 0,
            totalVote: 0,
            sentiment: props.sentiment,
            flagged: props.profanity,
            flagCount: props.profanity ? 1 : 0,
          };
          await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
            .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
            .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID).set(replyObj);
          // Update the counter.
          await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID).update({
            totalReplies: firebase.firestore.FieldValue.increment(1),
          });
          await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.GLOBALS_REF.REPLY_COUNT).set(firebase.database.ServerValue.increment(1));
          // Update the user's replies array and totalReplies count.
          await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
            replies: firebase.firestore.FieldValue.arrayUnion(props.ID),
            totalReplies: firebase.firestore.FieldValue.increment(1)
          });
          return { result: RESULTS.SUCCESS, payload: {
            ID: props.ID,
            userVote: 0,
            ...replyObj,
            createdOn: Date.now(),
          } };
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
        }
      } else {
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  loadURLDetails: async (props) => {
    try {
      const URLDetailsSnapshot = await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID).get();
      const userVoteObj = props.isAuth ? await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.URLS + props.ID + '/' + props.authUser.username).once('value')).val() : null;
      const URLDetails = URLDetailsSnapshot.data();
      return {
        result: RESULTS.SUCCESS,
        payload: URLDetailsSnapshot.exists ? {
          userVote: userVoteObj !== null ? userVoteObj.vote : 0,
          ...URLDetails,
          createdOn: URLDetails.createdOn.toMillis()
        } : null
      };
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  loadCommentDetails: async (props) => {
    try {
      const commentDetailsSnapshot = await DATABASE.STORAGE
        .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
        .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).get();
      const commentExists = commentDetailsSnapshot.exists;
      const commentObject = commentDetailsSnapshot.data();
      const userVoteObj =
      (props.isAuth && commentExists && commentObject !== undefined) ?
        (
          !commentObject.deleted ? 
          await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.COMMENTS + props.ID + '/' + props.authUser.username).once('value')).val()
          :
          null
        )
      :
      null;
      return {
        result: RESULTS.SUCCESS,
        payload: commentExists ? {
          ID: commentDetailsSnapshot.id,
          userVote: userVoteObj !== null ? userVoteObj.vote : 0,
          ...commentObject
        } : null
      };
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  loadReplyDetails: async (props) => {
    try {
      const replyDetailsSnapshot = await DATABASE.STORAGE
        .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
        .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
        .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID).get();
      const userVoteObj = props.isAuth ? await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.REPLIES + props.ID + '/' + props.authUser.username).once('value')).val() : null;
      return {
        result: RESULTS.SUCCESS,
        payload: replyDetailsSnapshot.exists ? {
          ID: replyDetailsSnapshot.id,
          userVote: userVoteObj !== null ? userVoteObj.vote : 0,
          ...replyDetailsSnapshot.data()
        } : null
      };
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  voteURL: async (props) => {
    try {
      // Check if URL exists.
      const currentTime = Date.now();
      const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).get()).data();
      if (!(await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID).get()).exists) {
        // If URLID doesn't already exist, create it and increase the counter. Advertise this counter on the website.
        // Check if this user can create new URL.
        if (userOptions.totalURLs === undefined) {
          // Update user object to the latest version.
          await updateUserObject({ username: props.authUser.username, quota: { URLs: 1 } });
        }
        if (userOptions.quota.endTime <= currentTime) {
          // Period is over. Set new endTime period and reset quota values.
          await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
            quota: {
              URLs: 1,
              comments: 0,
              replies: 0,
              endTime: currentTime + TWENTY_FOUR_HOURS
            }
          });
        } else if (userOptions.quota.endTime >= currentTime && userOptions.quota.URLs < QUOTA[ userOptions.plan ].URLs) {
          // Period is not over but it's below the quota.
          await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
            'quota.URLs': firebase.firestore.FieldValue.increment(1)
          });
        } else {
          // Period not over but above quota.
          return { result: RESULTS.FAILURE, payload: { code: 'above-quota', message: 'Your website quota for today is full. You can wait or purchase a higher plan.' } };
        }
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID).set({
          createdBy: props.authUser.username,
          createdOn: firebase.firestore.FieldValue.serverTimestamp(),
          link: props.link,
          title: props.title,
          favicon: props.favicon,
          totalComments: 0,
          totalSentiment: 0,
          upVotes: props.vote === UPVOTE ? 1 : 0,
          downVotes: props.vote === DOWNVOTE ? 1 : 0,
          totalVote: props.vote === UPVOTE ? 1 : props.vote === DOWNVOTE ? -1 : 0,
          flagged: false,
          flagCount: 0
        });
        await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.GLOBALS_REF.URL_COUNT).set(firebase.database.ServerValue.increment(1));
        await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.URLS + props.ID + '/' + props.authUser.username).set({
          time: firebase.database.ServerValue.TIMESTAMP,
          vote: props.vote
        });
        // Update the user's URLs array and totalURLs count.
        await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
          URLs: firebase.firestore.FieldValue.arrayUnion(props.ID),
          totalURLs: firebase.firestore.FieldValue.increment(1)
        });
      } else {
        // Get the previous vote.
        const previousVoteObj = await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.URLS + props.ID + '/' + props.authUser.username).once('value')).val();
        const previousVote = previousVoteObj !== null ? previousVoteObj.vote : NOVOTE;
        if (props.vote === UPVOTE) {
          if (previousVote === NOVOTE) {
            await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID)
            .update({
              upVotes: firebase.firestore.FieldValue.increment(1),
              totalVote: firebase.firestore.FieldValue.increment(1),
            });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayUnion(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(1)
            });
          } else if (previousVote === UPVOTE) {
            await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID)
            .update({
              upVotes: firebase.firestore.FieldValue.increment(-1),
              totalVote: firebase.firestore.FieldValue.increment(-1),
            });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayRemove(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(-1)
            });
          } else if (previousVote === DOWNVOTE) {
            await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID)
            .update({
              upVotes: firebase.firestore.FieldValue.increment(1),
              downVotes: firebase.firestore.FieldValue.increment(-1),
              totalVote: firebase.firestore.FieldValue.increment(2),
            });
          }
        } else if (props.vote === DOWNVOTE) {
          if (previousVote === NOVOTE) {
            await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID)
            .update({
              downVotes: firebase.firestore.FieldValue.increment(1),
              totalVote: firebase.firestore.FieldValue.increment(-1),
            });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayUnion(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(1)
            });
          } else if (previousVote === DOWNVOTE) {
            await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID)
            .update({
              downVotes: firebase.firestore.FieldValue.increment(-1),
              totalVote: firebase.firestore.FieldValue.increment(1),
            });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayRemove(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(-1)
            });
          } else if (previousVote === UPVOTE) {
            await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID)
            .update({
              upVotes: firebase.firestore.FieldValue.increment(-1),
              downVotes: firebase.firestore.FieldValue.increment(1),
              totalVote: firebase.firestore.FieldValue.increment(-2),
            });
          }
        }
        // Initialize new vote object.
        const newVoteObj = previousVote === props.vote ? null : {
          time: firebase.database.ServerValue.TIMESTAMP,
          vote: props.vote
        };
        await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.URLS + props.ID + '/' + props.authUser.username).set(newVoteObj);
      }
      return { result: RESULTS.SUCCESS, payload: null };
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  voteComment: async (props) => {
    try {
      // Check if comment exists and isn't earmarked for deletion.
      const commentSnapshot = await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).get();
      const commentExists = commentSnapshot.exists;
      const commentObject = commentSnapshot.data();
      if (commentExists && commentObject !== undefined) {
        if (!commentObject.deleted) {
          const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).get()).data();
          if (userOptions.totalVotes === undefined) {
            // Update user object to the latest version.
            await updateUserObject({ username: props.authUser.username });
          }
          // Get the previous vote.
          const previousVoteObj = await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.COMMENTS + props.ID + '/' + props.authUser.username).once('value')).val();
          const previousVote = previousVoteObj !== null ? previousVoteObj.vote : NOVOTE;
          if (props.vote === UPVOTE) {
            if (previousVote === NOVOTE) {
              await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID)
              .update({
                upVotes: firebase.firestore.FieldValue.increment(1),
                totalVote: firebase.firestore.FieldValue.increment(1),
              });
              // Update the user's votes array and totalVotes count.
              await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
                votes: firebase.firestore.FieldValue.arrayUnion(props.ID),
                totalVotes: firebase.firestore.FieldValue.increment(1)
              });
            } else if (previousVote === UPVOTE) {
              await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).update({
                upVotes: firebase.firestore.FieldValue.increment(-1),
                totalVote: firebase.firestore.FieldValue.increment(-1),
              });
              // Update the user's votes array and totalVotes count.
              await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
                votes: firebase.firestore.FieldValue.arrayRemove(props.ID),
                totalVotes: firebase.firestore.FieldValue.increment(-1)
              });
            } else if (previousVote === DOWNVOTE) {
              await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).update({
                upVotes: firebase.firestore.FieldValue.increment(1),
                downVotes: firebase.firestore.FieldValue.increment(-1),
                totalVote: firebase.firestore.FieldValue.increment(2),
              });
            }
          } else if (props.vote === DOWNVOTE) {
            if (previousVote === NOVOTE) {
              await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).update({
                downVotes: firebase.firestore.FieldValue.increment(1),
                totalVote: firebase.firestore.FieldValue.increment(-1),
              });
              // Update the user's votes array and totalVotes count.
              await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
                votes: firebase.firestore.FieldValue.arrayUnion(props.ID),
                totalVotes: firebase.firestore.FieldValue.increment(1)
              });
            } else if (previousVote === DOWNVOTE) {
              await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).update({
                downVotes: firebase.firestore.FieldValue.increment(-1),
                totalVote: firebase.firestore.FieldValue.increment(1),
              });
              // Update the user's votes array and totalVotes count.
              await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
                votes: firebase.firestore.FieldValue.arrayRemove(props.ID),
                totalVotes: firebase.firestore.FieldValue.increment(-1)
              });
            } else if (previousVote === UPVOTE) {
              await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).update({
                upVotes: firebase.firestore.FieldValue.increment(-1),
                downVotes: firebase.firestore.FieldValue.increment(1),
                totalVote: firebase.firestore.FieldValue.increment(-2),
              });
            }
          }
          // Initialize new vote object.
          const newVoteObj = previousVote === props.vote ? null : {
            time: firebase.database.ServerValue.TIMESTAMP,
            vote: props.vote
          };
          await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.COMMENTS + props.ID + '/' + props.authUser.username).set(newVoteObj);
          return { result: RESULTS.SUCCESS, payload: null };
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
        }
      } else {
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  voteReply: async (props) => {
    try {
      // Check if reply exists.
      if ((await DATABASE.STORAGE
        .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
        .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
        .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID).get()).exists
      ) {
        const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).get()).data();
        if (userOptions.totalVotes === undefined) {
          // Update user object to the latest version.
          await updateUserObject({ username: props.authUser.username });
        }
        // Get the previous vote.
        const previousVoteObj = await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.REPLIES + props.ID + '/' + props.authUser.username).once('value')).val();
        const previousVote = previousVoteObj !== null ? previousVoteObj.vote : NOVOTE;
        if (props.vote === UPVOTE) {
          if (previousVote === NOVOTE) {
            await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
              .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID)
              .update({
                upVotes: firebase.firestore.FieldValue.increment(1),
                totalVote: firebase.firestore.FieldValue.increment(1),
              });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayUnion(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(1)
            });
          } else if (previousVote === UPVOTE) {
            await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
              .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID)
              .update({
                upVotes: firebase.firestore.FieldValue.increment(-1),
                totalVote: firebase.firestore.FieldValue.increment(-1),
              });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayRemove(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(-1)
            });
          } else if (previousVote === DOWNVOTE) {
            await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
              .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID)
              .update({
                upVotes: firebase.firestore.FieldValue.increment(1),
                downVotes: firebase.firestore.FieldValue.increment(-1),
                totalVote: firebase.firestore.FieldValue.increment(2),
              });
          }
        } else if (props.vote === DOWNVOTE) {
          if (previousVote === NOVOTE) {
            await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
              .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID)
              .update({
                downVotes: firebase.firestore.FieldValue.increment(1),
                totalVote: firebase.firestore.FieldValue.increment(-1),
              });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayUnion(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(1)
            });
          } else if (previousVote === DOWNVOTE) {
            await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
              .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID)
              .update({
                downVotes: firebase.firestore.FieldValue.increment(-1),
                totalVote: firebase.firestore.FieldValue.increment(1),
              });
            // Update the user's votes array and totalVotes count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              votes: firebase.firestore.FieldValue.arrayRemove(props.ID),
              totalVotes: firebase.firestore.FieldValue.increment(-1)
            });
          } else if (previousVote === UPVOTE) {
            await DATABASE.STORAGE
              .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
              .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
              .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID)
              .update({
                upVotes: firebase.firestore.FieldValue.increment(-1),
                downVotes: firebase.firestore.FieldValue.increment(1),
                totalVote: firebase.firestore.FieldValue.increment(-2),
              });
          }
        }
        // Initialize new vote object.
        const newVoteObj = previousVote === props.vote ? null : {
          time: firebase.database.ServerValue.TIMESTAMP,
          vote: props.vote
        };
        await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.REPLIES + props.ID + '/' + props.authUser.username).set(newVoteObj);
        return { result: RESULTS.SUCCESS, payload: null };
      } else {
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Reply does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  flagURL: async (props) => {
    try {
      // Check if URL exists before flagging it.
      if ((await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID).get()).exists) {
        // Check if user has flagged this ID before.
        const hasUserFlaggedBefore = await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.URLS + props.ID + '/' + props.authUser.username).once('value')).val();
        if (!hasUserFlaggedBefore) {
          await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.ID).update({
            flagged: true,
            flagCount: firebase.firestore.FieldValue.increment(1),
          });
          await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.URLS + props.ID + '/' + props.authUser.username).set(firebase.database.ServerValue.TIMESTAMP);
        }
        return { result: RESULTS.SUCCESS, payload: null };
      } else {
        // ID does not exist.
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'URL does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  flagComment: async (props) => {
    try {
      // Check if comment exists and isn't earmarked for deletion.
      const commentSnapshot = await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).get();
      const commentExists = commentSnapshot.exists;
      const commentObject = commentSnapshot.data();
      if (commentExists) {
        if (!commentObject.deleted) {
          // Check if user has flagged this comment before.
          const hasUserFlaggedBefore = await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.COMMENTS + props.ID + '/' + props.authUser.username).once('value')).val();
          if (!hasUserFlaggedBefore) {
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).update({
              flagged: true,
              flagCount: firebase.firestore.FieldValue.increment(1),
            });
            await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.COMMENTS + props.ID + '/' + props.authUser.username).set(firebase.database.ServerValue.TIMESTAMP);
          }
          return { result: RESULTS.SUCCESS, payload: null };
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
        }
      } else {
        // Comment does not exist.
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  flagReply: async (props) => {
    try {
      // Check if reply exists before flagging it.
      if ((await DATABASE.STORAGE
        .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
        .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
        .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID).get()).exists
      ) {
        // Check if user has flagged this reply before.
        const hasUserFlaggedBefore = await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.REPLIES + props.ID + '/' + props.authUser.username).once('value')).val();
        if (!hasUserFlaggedBefore) {
          await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
            .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
            .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID)
            .update({
              flagged: true,
              flagCount: firebase.firestore.FieldValue.increment(1),
            });
          await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.REPLIES + props.ID + '/' + props.authUser.username).set(firebase.database.ServerValue.TIMESTAMP);
        }
        return { result: RESULTS.SUCCESS, payload: null };
      } else {
        // reply does not exist.
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Reply does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  deleteComment: async (props) => {
    try {
      // Check if comment exists and isn't earmarked for deletion already.
      const commentSnapshot = await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).get();
      const commentExists = commentSnapshot.exists;
      const commentObject = commentSnapshot.data();
      if (commentExists) {
        if (!commentObject.deleted) {
          // Get the author's username.
          const author = commentObject.author;
          if (author === props.authUser.username) {
            // NOTE: Just earmark the comment for deletion at this point.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.ID).update({
              deleted: true,
            });
            // Delete all votes to this comment.
            await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.COMMENTS + props.ID + '/').set(null);
            // Delete all flags to this comment.
            await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.COMMENTS + props.ID + '/').set(null);
            // Update the counter.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).update({
              totalComments: firebase.firestore.FieldValue.increment(-1),
            });
            await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.GLOBALS_REF.COMMENT_COUNT).set(firebase.database.ServerValue.increment(-1));
            const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).get()).data();
            if (userOptions.totalComments === undefined) {
              // Update user object to the latest version.
              await updateUserObject({ username: props.authUser.username, quota: { comments: 0 } });
            }
            // Update the user's comments array and totalComments count.
            await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
              comments: firebase.firestore.FieldValue.arrayRemove(props.ID),
              totalComments: firebase.firestore.FieldValue.increment(-1),
              'quota.comments': firebase.firestore.FieldValue.increment(-1)
            });
            return { result: RESULTS.SUCCESS, payload: null };
          } else {
            // Not my circus, not my clown.
            return { result: RESULTS.FAILURE, payload: { code: 'unauthorized', message: 'User does not have authority over this comment.' } };
          }
        } else {
          // Comment already deleted.
          return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
        }
      } else {
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  },
  deleteReply: async (props) => {
    try {
      // Check if comment exists and isn't earmarked for deletion already.
      const commentSnapshot = await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID).get();
      const commentExists = commentSnapshot.exists;
      const commentObject = commentSnapshot.data();
      if (commentExists) {
        if (!commentObject.deleted) {
          // Get the author's username.
          const replyObj = (await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
            .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
            .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID).get()).data();
          if (replyObj !== undefined) {
            if (replyObj.author === props.authUser.username) {
              await DATABASE.STORAGE
                .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID)
                .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID)
                .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).doc(props.ID).delete();
              // Delete all votes to this reply.
              await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.REPLIES + props.ID + '/').set(null);
              // Delete all flags to this reply.
              await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.FLAGS_REF.REPLIES + props.ID + '/').set(null);
              // Update the counter. NOTE: Add an additional check here when we have the ability to delete comments instead of just earmarking them.
              await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(props.URLID).collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(props.commentID).update({
                totalReplies: firebase.firestore.FieldValue.increment(-1),
              });
              await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.GLOBALS_REF.REPLY_COUNT).set(firebase.database.ServerValue.increment(-1));
              const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).get()).data();
              if (userOptions.totalReplies === undefined) {
                // Update user object to the latest version.
                await updateUserObject({ username: props.authUser.username, quota: { replies: 0 } });
              }
              // Update the user's replies array and totalReplies count.
              await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.authUser.username).update({
                replies: firebase.firestore.FieldValue.arrayRemove(props.ID),
                totalReplies: firebase.firestore.FieldValue.increment(-1),
                'quota.replies': firebase.firestore.FieldValue.increment(1)
              });
              return { result: RESULTS.SUCCESS, payload: null };
            } else {
              // Not my circus, not my clown.
              return { result: RESULTS.FAILURE, payload: { code: 'unauthorized', message: 'User does not have authority over this comment.' } };
            }
          } else {
            return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Reply does not exist.' } };
          }
        } else {
          // Comment already deleted.
          return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment already deleted.' } };
        }
      } else {
        return { result: RESULTS.FAILURE, payload: { code: 'invalid-id', message: 'Comment does not exist.' } };
      }
    } catch (e) {
      return { result: RESULTS.FAILURE, payload: e };
    }
  }
};

const updateUserObject = async (props) => {
  try {
    // Server operation.
    await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(props.username).set({
      URLs: [],
      comments: [],
      replies: [],
      votes: [],
      totalURLs: 0,
      totalComments: 0,
      totalReplies: 0,
      totalVotes: 0,
      createdOn: firebase.firestore.FieldValue.serverTimestamp(),
      quota: {
        URLs: props.quota?.URLs ?? 0,
        comments: props.quota?.comments ?? 0,
        replies: props.quota?.replies ?? 0,
        endTime: 0
      },
      plan: PLANS.FREE
    });
    return { result: RESULTS.SUCCESS, payload: null };
  } catch(e) {
    return { result: RESULTS.FAILURE, payload: e };
  }
};

// const handleSpam = {
//   // TODO: RESET SPAM EVERY 24 HOURS
//   addAction: (newAction) => {
//     actions = {
//       ...actions,
//       [newAction.type]: {
//         ...actions[newAction.type],
//         [newAction.target]: {
//           history: [ { hash: newAction.hash, time: Date.now() }, ...actions[newAction.type][newAction.target].history ].slice(0, 10),
//           lastModified: Date.now(),
//           delta: actions[newAction.type][newAction.target].lastModified - Date.now()
//         }
//       },
//       lastModified: Date.now(),
//       delta: actions.lastModified - Date.now()
//     };
//   },
//   isValidActionObject: (action) => {
//     return (action && ACTION.TYPES.includes(action?.type) && ACTION.TARGETS.includes(action?.target) && action?.hash && typeof action?.hash === 'string');
//   },
//   isSpamming: (newAction) => {
//     let invalidDelta = false, invalidHash = false;
//     if (handleSpam.isValidActionObject(newAction)) {
//       const newDelta = actions[newAction.type][newAction.target].lastModified - Date.now();
//       if (newDelta > SPAM.maxDelta) {
//         invalidDelta = true;
//       } for (const oldAction of actions[newAction.type][newAction.target].history) {
//         if (oldAction.hash === newAction.hash) {
//           invalidHash = true;
//         }
//       } if (invalidDelta || invalidHash) {
//         chrome.storage.sync.get(['spamStrike'], (result) => {
//           if (result) {
//             const newStrike = result.spamStrike[newAction.type][newAction.target] + 1;
//             chrome.storage.sync.set({
//               spamStrike: {
//                 ...result.spamStrike,
//                 [newAction.type]: {
//                   ...result.spamStrike[newAction.type],
//                   [newAction.target]: newStrike
//                 }
//               }
//             });
//             if (newStrike > SPAM.banThreshold) {
//               return { result: true, payload: 'ban' };
//             } else if (newStrike > SPAM.warnThreshold) {
//               return { result: false, payload: 'warn' };
//             } else {
//               return { result: false };
//             }
//           } else {
//             chrome.storage.sync.set({
//               spamStrike: {
//                 ...SPAM_STRIKE,
//                 [newAction.type]: {
//                   ...SPAM_STRIKE[newAction.type],
//                   [newAction.target]: 1
//                 }
//               }
//             });
//             return { result: false };
//           }
//         });
//       } else {
//         return { result: false };
//       }
//     } else {
//       return { result: true, payload: 'invalid' };
//     }
//   }
// };