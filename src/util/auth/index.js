/* global chrome */

// Packages:
import { AUTH } from '../../firebase/config';


// Constants:
import { RESULTS } from '../../constants';


// Exports:
export const expEmailInUse = async (email) => {
  console.log(await AUTH.fetchSignInMethodsForEmail(email));
  try {
    return (await AUTH.fetchSignInMethodsForEmail(email)).length > 0;
  } catch(e) {
    return e;
  }
};

/**
 * Re-authenticates the user.
 * @async
 * @returns { { result: string, payload: object } } An object with the keys result, which represents function result, and a payload.
 * @example 
 * import { reAuthenticateUser } from './hooks/auth';
 * const { result, payload } = await reAuthenticateUser('PASSWORD');
 */
export const reAuthenticateUser = async (password) => {
  try {
    const { result: reAuthenticationResult, payload: reAuthenticationPayload } = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'REAUTHENTICATE_USER',
          payload: {
            password
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
    if (reAuthenticationResult === RESULTS.SUCCESS) {
      return { result: RESULTS.SUCCESS, payload: reAuthenticationPayload };
    } else {
      return { result: RESULTS.FAILURE, payload: reAuthenticationPayload };
    }
  } catch(e) {
    return { result: RESULTS.FAILURE, payload: e };
  }
};
