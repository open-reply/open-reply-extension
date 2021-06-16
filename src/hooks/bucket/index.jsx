/* global chrome */

// Packages:
import { useSelector } from 'react-redux';


// Constants:
import { RESULTS } from '../../constants';


// Functions:
const useBucket = () => {
  // State:
  const { isAuth, user: authUser } = useSelector(state => state.auth);

  // Return:
  return {
    /**
    * Uploads the user's profile picture.
    * @async
    * @param { Blob | File } dataURL The file dataURL.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useBucket from './hooks/bucket';
    * const { uploadProfilePicture } = useBucket();
    * const { result, payload } = await uploadProfilePicture(dataURL);
    */
    uploadProfilePicture: async (dataURL) => {
      try {
        if (isAuth) {
          return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'UPLOAD_PROFILE_PICTURE',
                payload: {
                  authUser,
                  dataURL
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
          return { result: RESULTS.FAILURE, payload: { code: 'auth/not-logged-in', message: 'User is not logged in.' } }; 
        }
      } catch(e) {
        return { result: RESULTS.FAILURE, payload: e };
      }
    },
    /**
    * Uploads the user's profile picture.
    * @async
    * @param { string } username The username.
    * @returns { { result: string, payload: object | null } } An object with the keys result, which represents function result, and a payload.
    * @example 
    * import useBucket from './hooks/bucket';
    * const { downloadProfilePicture } = useBucket();
    * const { result, payload } = await downloadProfilePicture(username);
    */
    downloadProfilePicture: async (UID) => {
      try {
        return await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'DOWNLOAD_PROFILE_PICTURE',
              payload: {
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
    }
  };
};


// Exports:
export default useBucket;
