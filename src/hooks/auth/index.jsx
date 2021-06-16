/* global chrome */

// Packages:
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DATABASE } from '../../firebase/config';
import useDatabase from '../database';
import { reAuthenticateUser } from '../../util/auth';


// Imports:
import { ACCOUNT } from '../../assets/icons';


// Constants:
import { RESULTS } from '../../constants';
import { DEFAULT_AUTH_USER } from '../../constants/auth';
import { DATABASE_CONSTANTS, DEFAULT_DATABASE_USER } from '../../constants/database';


// Redux:
import {
  updateAuth,
  updateDatabase
} from '../../redux/actions';


// Functions:
/**
  * A custom React Hook that handles all AUTH operations by itself.
  * @async
  * @example 
  * import useAuth from './hooks/auth';
  * const { register, login, logout, ... } = useAuth();
  */
const useAuth = () => {
  // Constants:
  const dispatch = useDispatch();
  const { addUser } = useDatabase();

  // State:
  const { isAuth, user: authUser } = useSelector(state => state.auth);
  const [ unsubscribeFromAuth, setUnsubscribeFromAuth ] = useState(() => {});

  // Effects:
  useEffect(() => {
    return () => {
      if (unsubscribeFromAuth !== null) {
        setUnsubscribeFromAuth();
      }
    }
  }, [ unsubscribeFromAuth ]);

  // Return:
  return {
    /**
    * Registers the user.
    * @async
    * @param { string } email The user's email address.
    * @param { string } username The user's username.
    * @param { string } password The user's password.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useAuth from './hooks/auth';
    * const { register } = useAuth();
    * const { result, payload } = await register(email, password);
    */
    register: async (email, username, password) => {
      try {
        // Server operation.
        const usernameInUse = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(username).get()).exists;
        if (!usernameInUse) {
          const { result: backgroundRegisterResult, payload: backgroundRegisterPayload } = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'REGISTER',
                payload: {
                  username,
                  email,
                  password,
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
          if (backgroundRegisterResult === RESULTS.SUCCESS) {
            const { result: addUserResult, payload: addUserPayload } = await addUser(username, backgroundRegisterPayload.uid);
            if (addUserResult === RESULTS.SUCCESS) {
              // Local store operation.
              dispatch(updateAuth({
                isAuth: true,
                user: {
                  username,
                  email,
                  emailVerified: false,
                  photoURL: ACCOUNT,
                  UID: backgroundRegisterPayload.uid
                }
              }));
              return { result: RESULTS.SUCCESS, payload: null };
            } else {
              return { result: RESULTS.FAILURE, payload: addUserPayload };
            }
          }
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'username-taken', message: 'Username is already in use.' } };
        }
      } catch(e) {
        if (e.payload) {
          if (e.payload.code === 'email-in-use') {
            return { result: RESULTS.FAILURE, payload: e.payload };
          } else {
            return { result: RESULTS.FAILURE, payload: e };
          }
        } else {
          return { result: RESULTS.FAILURE, payload: e };
        }
      }
    },
    /**
    * Logs the user in.
    * @async
    * @param { string } email The user's email address.
    * @param { string } password The user's password.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
      * import useAuth from './hooks/auth';
      * const { login } = useAuth();
      * const { result, payload } = await login(email, password);
    */
    login: async (email, password) => {
      try {
        // Server operation.
        const { result: backgroundLoginResult, payload: backgroundLoginPayload } = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'LOGIN',
              payload: {
                email,
                password
              }
            }, 
            (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response);
              }
            }
          );
        });
        if (backgroundLoginResult === RESULTS.SUCCESS) {
          const userObject = await (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(backgroundLoginPayload.displayName).get()).data();
          // Local store operation.
          if (userObject) {
            dispatch(updateDatabase({
              loaded: true,
              user: userObject
            }));
          } else {
            // NOTE: Put an error here in the future. Right now, we just populate Redux with the default values.
            dispatch(updateDatabase({
              loaded: false,
              user: DEFAULT_DATABASE_USER
            }));
          }
          dispatch(updateAuth({
            isAuth: true,
            user: {
              username: backgroundLoginPayload.displayName,
              email: backgroundLoginPayload.email,
              emailVerified: backgroundLoginPayload.emailVerified,
              photoURL: backgroundLoginPayload.photoURL,
              UID: backgroundLoginPayload.uid
            }
          }));
          return { result: RESULTS.SUCCESS, payload: null };
        } else {
          return { result: RESULTS.FAILURE, payload: backgroundLoginPayload };
        }
      } catch(e) {
        if (e.payload) {
          if (e.payload.code === 'email-not-verified') {
            return { result: RESULTS.FAILURE, payload: e.payload };
          } else {
            return { result: RESULTS.FAILURE, payload: e };
          }
        } else {
          return { result: RESULTS.FAILURE, payload: e };
        }
      }
    },
    /**
    * Logs the user out.
    * @async
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
      * import useAuth from './hooks/auth';
      * const { logout } = useAuth();
      * const { result, payload } = await logout();
    */
    logout: async () => {
      try {
        if (isAuth) {
          // Server operation.
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'LOGOUT'
              }, 
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response.payload);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response.payload);
              }
            });
          });
          // Local store operation.
          dispatch(updateAuth({
            isAuth: false,
            user: DEFAULT_AUTH_USER
          }));
          return { result: RESULTS.SUCCESS, payload: null };
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'auth/not-logged-in', message: 'User is not logged in.' } };
        }
      } catch(e) {
        return { result: RESULTS.SUCCESS, payload: e };
      }
    },
    /**
    * Subscribes to auth events.
    * @returns { function } Function to unsubscribe from auth events.
    * @example 
      * import useAuth from './hooks/auth';
      * const { subscribeToAuth } = useAuth();
      * const newUnsubToAuth = subscribeToAuth();
      * // Later on, whenever you'd like to unsubscribe from auth:
      * newUnsubscribeFromAuth();
    */
    updateAuthState: async (user) => {
      try {
        if (user) {
          // User is logged in.
          if (!isAuth) {
            let optionsInStorage = false;
            chrome.storage.sync.get(['options'], (result) => {
              if (result) {
                if (result.options.username === user.displayName) {
                  dispatch(updateDatabase({
                    loaded: true,
                    user: result.options
                  }));
                  optionsInStorage = true;
                }
              }
            });
            if (!optionsInStorage) {
              // Server operation.
              const userOptions = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(user.displayName).get()).data();
              // Local store operation.
              dispatch(updateDatabase({
                loaded: true,
                user: userOptions
              }));
            } else {
              dispatch(updateDatabase({
                loaded: true,
                user: DEFAULT_DATABASE_USER
              }));
            }
            dispatch(updateAuth({
              loaded: true,
              isAuth: true,
              user: {
                username: user.displayName,
                email: user.email,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL === null ? ACCOUNT : user.photoURL,
                UID: user.uid
              }
            }));
          }
        } else {
          // No user is logged in.
          // Local store operation.
          dispatch(updateAuth({
            loaded: true,
            isAuth: false,
            user: DEFAULT_AUTH_USER
          }));
          chrome.storage.sync.set({ options: { ...DEFAULT_DATABASE_USER, username: null } });
        }
      } catch(e) {
        console.error('Something went wrong.. Please report this error. CODE: KEK', e);
      }
    },
    /**
    * Updates the user's basic information.
    * @async
    * @param { string } username The user's new username.
    * @param { string } photoURL The link to the user's new profile picture.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useAuth from './hooks/auth';
    * const { updateUser } = useAuth();
    * const { result, payload } = await updateUser({ newUsername, newPhotoURL });
    */
    updateUser: async ({ username, photoURL }) => {
      try {
        // Server operation.
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'UPDATE_USER',
              payload: {
                username,
                photoURL,
              }
            }, 
            (response) => {
            if (response.result === RESULTS.SUCCESS) {
              resolve(response.payload);
            } else if (response.result === RESULTS.FAILURE) {
              reject(response.payload);
            }
          });
        });
        // Local store operation.
        dispatch(updateAuth({
          isAuth: true,
          user: {
            ...authUser,
            username: username ? username : authUser.username,
            photoURL: photoURL ? photoURL : authUser.photoURL,
          }
        }));
        return { result: RESULTS.SUCCESS, payload: null };
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    reAuthenticateUser,
    /**
    * Update the user's email.
    * @async
    * @param { string } newEmail The user's new email address.
    * @param { string } password The user's password.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
      * import useAuth from './hooks/auth';
      * const { updateUserEmail } = useAuth();
      * const { result, payload } = await updateUserEmail(newEmail, password);
    */
    updateUserEmail: async (newEmail, password) => {
      try {
        // Reauthenticate user.
        const { result: reAuthenticationResult, payload: reAuthenticationPayload } = reAuthenticateUser(password);
        if (reAuthenticationResult === RESULTS.SUCCESS) {
          // NOTE: Either this OR the next one.
          await reAuthenticationPayload.user.updateEmail(newEmail);
          // await AUTH.currentUser.updateEmail(newEmail);
          return { result: RESULTS.SUCCESS, payload: null };
        } else if (reAuthenticationResult === RESULTS.FAILURE) {
          return { result: RESULTS.FAILURE, payload: reAuthenticationPayload };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * Verify user's current email address.
    * @async
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
      * import useAuth from './hooks/auth';
      * const { verifyUserEmail } = useAuth();
      * const { result, payload } = await verifyUserEmail();
    */
    verifyUserEmail: async () => {
      try {
        if (!authUser.emailVerified) {
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'VERIFY_USER_EMAIL'
              }, 
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response.payload);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response.payload);
              }
            });
          });
          return { result: RESULTS.SUCCESS, payload: null };
        } else {
          return { result: RESULTS.FAILURE, payload: { code: 'auth/email-already-verified', message: 'Email address is already verified.' } };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * Update the user's email.
    * @async
    * @param { string } password The user's password.
    * @param { string } newPassword The user's new password.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
      * import useAuth from './hooks/auth';
      * const { updateUserPassword } = useAuth();
      * const { result, payload } = await updateUserPassword(password, newPassword);
    */
    updateUserPassword: async (password, newPassword) => {
      try {
        // Reauthenticate user.
        const reAuthenticationResult = reAuthenticateUser(password);
        if (reAuthenticationResult.result === RESULTS.SUCCESS) {
          // NOTE: Either this OR the next one.
          // await reAuthenticationResult.payload.user.updateEmail(newEmail);
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'UPDATE_USER_PASSWORD',
                payload: {
                  newPassword
                }
              }, 
              (response) => {
              if (response.result === RESULTS.SUCCESS) {
                resolve(response.payload);
              } else if (response.result === RESULTS.FAILURE) {
                reject(response.payload);
              }
            });
          });
          return { result: RESULTS.SUCCESS, payload: null };
        } else if (reAuthenticationResult === RESULTS.FAILURE) {
          // Return the error.
          return { result: RESULTS.FAILURE, payload: reAuthenticationResult.payload };
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * Reset a user's password by sending them an email.
    * @async
    * @param { string } emailAddress The user's email address.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
      * import useAuth from './hooks/auth';
      * const { resetUserPassword } = useAuth();
      * const { result, payload } = await resetUserPassword(emailAddress);
    */
    resetUserPassword: async (emailAddress) => {
      try {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'RESET_USER_PASSWORD',
              payload: {
                emailAddress
              }
            }, 
            (response) => {
            if (response.result === RESULTS.SUCCESS) {
              resolve(response.payload);
            } else if (response.result === RESULTS.FAILURE) {
              reject(response.payload);
            }
          });
        });
        return { result: RESULTS.SUCCESS, payload: null };
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
  };
};


// Exports:
export default useAuth;
