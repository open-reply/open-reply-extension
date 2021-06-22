/* global chrome */

// Packages:
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DATABASE } from '../../firebase/config';
import { nanoid } from 'nanoid/non-secure';
import isProfane from '../../util/is-profane';
import Sentiment from 'sentiment';
import sanitizeURL from '../../util/url-sanitize';
import getLocalFavicon from '../../util/getLocalFavicon';
// import generateAction from '../../util/generateAction';


// Constants:
import { RESULTS } from '../../constants';
import { DATABASE_CONSTANTS } from '../../constants/database';


// Redux:
import { updateDatabase } from '../../redux/actions';


// Functions:
const useDatabase = () => {
  // Constants:
  const dispatch = useDispatch();
  const sentiment = new Sentiment();

  // State:
  const databaseUser = useSelector(state => state.database.user);
  const { isAuth, user: authUser } = useSelector(state => state.auth);
  const [ startAfterComment, setStartAfterComment ] = useState(null);
  const [ startAfterReply, setStartAfterReply ] = useState(null);

  // Return:
  return {
    /**
    * Adds the user to the database.
    * @async
    * @param { string } username The username.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { addUser } = useDatabase();
    * const { result, payload } = await addUser(username);
    */
    addUser: async (username, UID) => {
      try {
        return await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'ADD_USER',
              payload: {
                username,
                UID
              }
            },
            (response) => {
            if (response.result === RESULTS.SUCCESS) {
              resolve(response);
            } else if (response.result === RESULTS.FAILURE) {
              reject(response);
            }
          });
        });
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * Update user's babymode.
    * @todo Expand this function to handle more options.
    * @async
    * @param { string } newMode The new mode.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { updateBabyMode } = useDatabase();
    * const { result, payload } = await updateBabyMode(newMode);
    */
    updateBabyMode: async (newMode) => {
      try {
        if (isAuth) {
          // Server operation.
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'UPDATE_BABYMODE',
                payload: {
                  username: authUser.username,
                  newMode
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
          // Local store operation.
          dispatch(updateDatabase({
            user: {
              ...databaseUser,
              babyMode: newMode
            }
          }));
          chrome.storage.sync.set({ options: { babyMode: newMode, username: authUser.username } });
          return { result: RESULTS.SUCCESS, payload: null };
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'auth/not-logged-in', message: 'User is not logged in.' } }; 
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Post a comment.
    * @summary FS: 1 READs, 2 WRITEs; RD: 0 READ, 1 WRITEs
    * @async
    * @param { string } body The new mode.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { postComment } = useDatabase();
    * const { result, payload } = await postComment('This is a comment', kirak32('4chan.org/pol/'));
    */
    postComment: async (body, URLID) => {
      try {
        if (isAuth && authUser.username) {
          const localFavicon = await getLocalFavicon();
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'POST_COMMENT',
                payload: {
                  authUser,
                  body,
                  URLID,
                  ID: nanoid(20),
                  link: sanitizeURL(window.location.href),
                  title: document.title,
                  favicon: localFavicon,
                  profanity: isProfane(body),
                  sentiment: sentiment.analyze(body).comparative
                  // action: generateAction('WRITE', 'TEXT', body)
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Post a reply.
    * @summary FS: 1 READs, 2 WRITEs; RD: 0 READ, 1 WRITEs
    * @async
    * @param { string } body The new mode.
    * @param { string } commentID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { postReply } = useDatabase();
    * const { result, payload } = await postReply('This is a reply', 'commentID', kirak32('4chan.org/pol/'));
    */
    postReply: async (body, commentID, URLID) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'POST_REPLY',
                payload: {
                  authUser,
                  body,
                  commentID,
                  URLID,
                  ID: nanoid(20),
                  profanity: isProfane(body),
                  sentiment: sentiment.analyze(body).comparative
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Loads the details of a URL.
    * @summary FS: 1 READs, 0 WRITEs; RD: 1 READ, 0 WRITEs
    * @async
    * @param { string } ID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { loadURLDetails } = useDatabase();
    * const { result, payload } = await loadURLDetails(kirak32('4chan.org/pol/'));
    */
    loadURLDetails: async (ID) => {
      try {
        return await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'LOAD_URL_DETAILS',
              payload: {
                authUser,
                isAuth,
                ID
              }
            },
            (response) => {
            if (response.result === RESULTS.SUCCESS) {
              resolve(response);
            } else if (response.result === RESULTS.FAILURE) {
              reject(response);
            }
          });
        });
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Loads the details of a comment.
    * @summary FS: 1 READs, 0 WRITEs; RD: 1 READ, 0 WRITEs
    * @async
    * @param { string } ID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { loadCommentDetails } = useDatabase();
    * const { result, payload } = await loadCommentDetails('commentID', kirak32('4chan.org/pol/'));
    */
    loadCommentDetails: async (ID, URLID) => {
      try {
        return await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'LOAD_COMMENT_DETAILS',
              payload: {
                authUser,
                isAuth,
                ID,
                URLID
              }
            },
            (response) => {
            if (response.result === RESULTS.SUCCESS) {
              resolve(response);
            } else if (response.result === RESULTS.FAILURE) {
              reject(response);
            }
          });
        });
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Loads the details of a reply.
    * @summary FS: 1 READs, 0 WRITEs; RD: 1 READ, 0 WRITEs
    * @async
    * @param { string } ID The reply ID.
    * @param { string } commentID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { loadReplyDetails } = useDatabase();
    * const { result, payload } = await loadReplyDetails('replyID', 'commentID', kirak32('4chan.org/pol/'));
    */
    loadReplyDetails: async (ID, commentID, URLID) => {
      try {
        return await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'LOAD_REPLY_DETAILS',
              payload: {
                authUser,
                isAuth,
                ID,
                commentID,
                URLID
              }
            },
            (response) => {
            if (response.result === RESULTS.SUCCESS) {
              resolve(response);
            } else if (response.result === RESULTS.FAILURE) {
              reject(response);
            }
          });
        });
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Loads comments.
    * @summary FS: 20 READs, 0 WRITEs; RD: 20 READ, 0 WRITEs
    * @async
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @param { number } limit The number of comments to read.
    * @param { 'createdOn' | 'totalVote' } orderBy Parameter to order by.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { loadComments } = useDatabase();
    * const { result, payload } = await loadComments(kirak32('4chan.org/pol/'));
    */
    loadComments: async (URLID, limit = 20, orderBy = 'createdOn') => {
      try {
        const commentsArray = [];
        const commentSnapshots =
          startAfterComment === null ?
          await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(URLID)
            .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).where('deleted', '==', false).orderBy(orderBy).limit(limit).get()
          :
          await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(URLID)
            .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).where('deleted', '==', false).orderBy(orderBy).startAfter(startAfterComment).limit(limit).get();
        setStartAfterComment(commentSnapshots.docs[commentSnapshots.docs.length - 1]);
        // NOTE: Use for-of loop instead of foreach loop to ensure async-await works.
        for (const commentSnapshot of commentSnapshots.docs) {
          const commentID = commentSnapshot.id;
          const userVoteObj = isAuth ? await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.COMMENTS + commentID + '/' + authUser.username).once('value')).val() : null;
          commentsArray.push({
            ID: commentID,
            userVote: userVoteObj !== null ? userVoteObj.vote : 0,
            ...commentSnapshot.data(),
            createdOn: commentSnapshot.data().createdOn.toMillis()
          });
        }
        return { result: RESULTS.SUCCESS, payload: commentsArray };
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Loads replies.
    * @summary FS: 20 READs, 0 WRITEs; RD: 20 READ, 0 WRITEs
    * @async
    * @param { string } commentID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @param { number } limit The number of comments to read.
    * @param { 'createdOn' | 'totalVote' } orderBy Parameter to order by.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useDatabase from './hooks/database';
    * const { loadReplies } = useDatabase();
    * const { result, payload } = await loadReplies('commentID', kirak32('4chan.org/pol/'));
    */
    loadReplies: async (commentID, URLID, limit = 20, orderBy = 'createdOn') => {
      try {
        const repliesArray = [];
        const repliesSnapshots =
        startAfterReply === null ?
          await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(URLID)
            .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(commentID)
            .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).orderBy(orderBy).limit(limit).get()
          :
          await DATABASE.STORAGE
            .collection(DATABASE_CONSTANTS.STORAGE.URLS_COLLECTION).doc(URLID)
            .collection(DATABASE_CONSTANTS.STORAGE.COMMENTS_COLLECTION).doc(commentID)
            .collection(DATABASE_CONSTANTS.STORAGE.REPLIES_COLLECTION).orderBy(orderBy).startAfter(startAfterReply).limit(limit).get();
        setStartAfterReply(repliesSnapshots.docs[repliesSnapshots.docs.length - 1]);
        // NOTE: Use for-of loop instead of foreach loop to ensure async-await works.
        for (const repliesSnapshot of repliesSnapshots.docs) {
          const replyID = repliesSnapshot.id;
          const userVoteObj = isAuth ? await (await DATABASE.REALTIME.ref(DATABASE_CONSTANTS.REALTIME.VOTES_REF.REPLIES + replyID + '/' + authUser.username).once('value')).val() : null;
          repliesArray.push({
            ID: replyID,
            userVote: userVoteObj !== null ? userVoteObj.vote : 0,
            ...repliesSnapshot.data(),
            createdOn: repliesSnapshot.data().createdOn.toMillis()
          });
        }
        return { result: RESULTS.SUCCESS, payload: repliesArray };
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Votes on a URL.
    * @summary FS: 1 READs, 1 WRITEs; RD: 1 READ, 2 WRITEs
    * @async
    * @param { -1 | 1 } vote The vote.
    * @param { string } ID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { Promise<{ result: string, payload: object | null }> } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { voteURL } = useDatabase();
    * const { result, payload } = await voteURL(1, kirak32('4chan.org/pol/'));
    */
    voteURL: async (vote, ID) => {
      try {
        if (isAuth) {
          const localFavicon = await getLocalFavicon();
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'VOTE_URL',
                payload: {
                  authUser,
                  vote,
                  ID,
                  link: sanitizeURL(window.location.href),
                  title: document.title,
                  favicon: localFavicon
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Votes on a comment.
    * @summary FS: 1 READs, 1 WRITEs; RD: 1 READ, 1 WRITEs
    * @async
    * @param { -1 | 1 } vote The vote.
    * @param { string } ID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { Promise<{ result: string, payload: object | null }> } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { voteComment } = useDatabase();
    * const { result, payload } = await voteComment(1, 'commentID', kirak32('4chan.org/pol/'));
    */
    voteComment: async (vote, ID, URLID) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'VOTE_COMMENT',
                payload: {
                  authUser,
                  vote,
                  ID,
                  URLID
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Votes on a reply.
    * @summary FS: 1 READs, 1 WRITEs; RD: 1 READ, 1 WRITEs
    * @async
    * @param { -1 | 1 } vote The vote.
    * @param { string } ID The reply ID.
    * @param { string } commentID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { Promise<{ result: string, payload: object | null }> } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { voteReply } = useDatabase();
    * const { result, payload } = await voteReply(1, 'replyID', 'commentID', kirak32('4chan.org/pol/'));
    */
    voteReply: async (vote, ID, commentID, URLID) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'VOTE_REPLY',
                payload: {
                  authUser,
                  vote,
                  ID,
                  commentID,
                  URLID
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Flags a URL.
    * @summary FS: 1 READs, 1 WRITEs; RD: 1 READ, 1 WRITEs
    * @async
    * @param { string } ID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { flagURL } = useDatabase();
    * const { result, payload } = await flagURL(kirak32('4chan.org/pol/'));
    */
    flagURL: async (ID) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'FLAG_URL',
                payload: {
                  authUser,
                  ID
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Flags a comment.
    * @summary FS: 1 READs, 1 WRITEs; RD: 1 READ, 1 WRITEs
    * @async
    * @param { string } ID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { flagURL } = useDatabase();
    * const { result, payload } = await flagComment('commentID', kirak32('4chan.org/pol/'));
    */
    flagComment: async (ID, URLID) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'FLAG_COMMENT',
                payload: {
                  authUser,
                  ID,
                  URLID
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Flags a reply.
    * @summary FS: 1 READs, 1 WRITEs; RD: 1 READ, 1 WRITEs
    * @async
    * @param { string } ID The reply ID.
    * @param { string } commentID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { flagReply } = useDatabase();
    * const { result, payload } = await flagReply('replyID', 'commentID', kirak32('4chan.org/pol/'));
    */
    flagReply: async (ID, commentID, URLID) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'FLAG_REPLY',
                payload: {
                  authUser,
                  ID,
                  commentID,
                  URLID
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Deletes a comment.
    * @summary FS: 1 READs, 2 WRITEs; RD: 0 READ, 3 WRITEs
    * @async
    * @param { string } ID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { deleteComment } = useDatabase();
    * const { result, payload } = await deleteComment('commentID', kirak32('4chan.org/pol/'));
    */
    deleteComment: async (ID, URLID) => {
      // NOTE: Cannot delete comments yet due to issues with deleting subcollections. TODO: Requires Admin SDK.
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'DELETE_COMMENT',
                payload: {
                  authUser,
                  ID,
                  URLID
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * @description Deletes a reply.
    * @summary FS: 1 READs, 1 WRITEs, 1 DELETEs; RD: 0 READ, 3 WRITEs
    * @async
    * @param { string } ID The reply ID.
    * @param { string } commentID The comment ID.
    * @param { string } URLID The URL ID. Use kirak32 on the sanitized URL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example
    * import useDatabase from './hooks/database';
    * const { deleteReply } = useDatabase();
    * const { result, payload } = await deleteReply('replyID', 'commentID', kirak32('4chan.org/pol/'));
    */
    deleteReply: async (ID, commentID, URLID) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'DELETE_REPLY',
                payload: {
                  authUser,
                  ID,
                  commentID,
                  URLID
                }
              },
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            });
          });
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'user-logged-out', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    }
  };
};


// Exports:
export default useDatabase;
