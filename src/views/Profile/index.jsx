/*global chrome*/

// Packages:
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import ToggleButton from 'react-toggle-button';
import useAuth from '../../hooks/auth';
import useDatabase from '../../hooks/database';
import useBucket from '../../hooks/bucket';
import getDataURL from '../../util/getDataURL';
import { DATABASE } from '../../firebase/config';
import prettyMilliseconds from 'pretty-ms';
import { useInterval } from 'react-use';


// Imports:
import {
  LEFT_CHEVRON,
  CHECK,
  CROSS,
  ACCOUNT,
  LOADING
} from '../../assets/icons';


// Constants:
import COLORS from '../../styles/colors';
import THEMES from '../../styles/themes';
import ROUTES from '../../routes';
import { RESULTS } from '../../constants';
import { DEFAULT_DATABASE_USER, DATABASE_CONSTANTS } from '../../constants/database';
import { QUOTA } from '../../constants/user';
const UPLOAD_STATE = {
  IDLE: 'IDLE',
  UPLOADING: 'UPLOADING'
};


// Styles:
const Wrapper = styled.div`
  position: absolute;
  top: 8vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100vw;
  min-height: 82vh;
  padding: 5vh 0;
  transition: all 0.25s ease;
`;

const GoBack = styled.div`
  position: absolute;
  top: 3em;
  left: 3em;
  display: flex;
  flex-direction: row;
  cursor: pointer;
`;

const Logout = styled.div`
  position: absolute;
  top: 3em;
  right: 3em;
  display: flex;
  flex-direction: row;
  color: ${ COLORS.GAINSBORO };
  font-weight: 700;
  font-size: 1em;
  text-decoration: none;
  cursor: pointer;
`;

const GoBackIcon = styled.img`
  width: 0.8em;
  margin-right: 0.5em;
  filter: ${ props => props.theme === THEMES.DARK ? 'invert(100%)' : 'initial' };
`;

const GoBackText = styled.div`
  font-size: 1em;
`;

const ProfilePicture = styled.div`
  width: 8em;
  height: 8em;
  background-image: ${ props => 'url("' + props.imageSrc + '")' };
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  filter: ${ props => props.uploadState === UPLOAD_STATE.IDLE ? 'unset' : 'brightness(0.2) grayscale(1)' };
  cursor: pointer;
  transition: all 0.25s ease;
`;

const LoadingGIF = styled.div`
  position: relative;
  width: 4em;
  height: 4em;
  margin-top: -6rem;
  background-image: ${ props => 'url("' + props.imageSrc + '")' };
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  filter: ${ props => props.uploadState === UPLOAD_STATE.IDLE ? 'opacity(0)' : 'opacity(1)' };
  transition: all 0.25s ease 0.1s;
  user-select: none;
`;

const Username = styled.div`
  height: 1em;
  margin-top: 3rem;
  margin-bottom: 1rem;
  font-weight: 300;
  font-size: 0.9em;
  text-align: center;
`;

const UploadError = styled.div`
  color: ${ COLORS.ULTRA_RED };
  font-weight: 500;
  font-size: 0.8em;
  text-align: center;
  user-select: none;
`;

const QuotaSectionTitle = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const QuotaSection  = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  width: 60%;
  margin-bottom: 0.5rem;
`;

const QuotaValue = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 33.3%;
`;

const QuotaNumber = styled.div`
  color: ${ props => props.color };
  font-size: 1.5rem;
  font-weight: 700;
`;

const QuotaTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
`;

const QuotaExpiryTimeLeft = styled.div`
  margin-bottom: 0.5rem;
  color: ${ COLORS.GAINSBORO };
  font-size: 0.9rem;
`;

const Options = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 70%;
  margin-bottom: 1rem;
`;

const Option = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  width: 100%;
  margin-top: 0.7rem;
`;

const OptionText = styled.div`
  width: 65%;
`;

const OptionTitle = styled.div`
  margin-bottom: 0.2em;
  font-weight: 700;
  font-size: 1.3em;
`;

const OptionDescription = styled.div`
  font-weight: 400;
  font-size: 0.9em;
  color: ${ COLORS.MANATEE };
`;

const DonationText = styled.div`
  width: 70%;
  color: ${ COLORS.GAINSBORO };
  font-size: 0.8rem;
  word-break: break-word;
`;

const ToggleIcon = styled.img`
  position: relative;
  top: 0.05em;
  width: 0.9em;
  filter: invert(100%);
`;


// Functions:
const getQuotaColor = (current, limit) => {
  if (current >= (limit * 0.75).toFixed(0)) {
    // RED
    return COLORS.ULTRA_RED;
  } else if (current <= (limit * 0.25).toFixed(0)) {
    // GREEN
    return COLORS.GREEN_PANTONE;
  } else {
    // DEFAULT
    return 'inherit';
  }
};

const Profile = () => {
  // Constants:
  const history = useHistory();
  const { logout } = useAuth();
  const { updateBabyMode } = useDatabase();
  const { uploadProfilePicture } = useBucket();

  // State:
  const { theme, auth, database } = useSelector(state => state);
  const [ babyMode, setBabyMode ] = useState(database.user.babyMode);
  const [ ORB, setORB ] = useState(true);
  const [ uploadState, setUploadState ] = useState(UPLOAD_STATE.IDLE);
  const [ uploadError, setUploadError ] = useState('');
  const [ userObject, setUserObject ] = useState(DEFAULT_DATABASE_USER);
  const [ quotaPeriodTimeLeft, setQuotaPeriodTimeLeft ] = useState(0);

  // Ref:
  const uploadProfilePictureRef = useRef(null);

  // Effect:
  useEffect(() => {
    chrome.storage.sync.get(['bubbleVisibility'], (result) => {
      if (result) {
        if (typeof result.bubbleVisibility === 'boolean') {
          setORB(result.bubbleVisibility);
        }
      }
    });
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message.type === 'PROFILE_PICTURE_UPLOADED') {
        setUploadState(UPLOAD_STATE.IDLE);
      }
    });
    if (auth.isAuth && auth.loaded) {
      (async () => {
        const userObject = (await DATABASE.STORAGE.collection(DATABASE_CONSTANTS.STORAGE.USERS_COLLECTION).doc(auth.user.username).get()).data();
        if (userObject.quota.endTime - Date.now() >= 0) {
          setUserObject(userObject);
          setQuotaPeriodTimeLeft(userObject.quota.endTime - Date.now());
        } else {
          setUserObject({
            ...userObject,
            quota: {
              URLs: 0,
              comments: 0,
              replies: 0,
              endTime: 0
            }
          });
        }
      })();
    }
  }, [ auth.isAuth, auth.loaded, auth.user.username ]);

  useInterval(() => {
    if (quotaPeriodTimeLeft > 0 && auth.isAuth && auth.loaded) {
      setQuotaPeriodTimeLeft(userObject.quota.endTime - Date.now());
    } else if (quotaPeriodTimeLeft <= 0 && auth.isAuth && auth.loaded) {
      setUserObject({
        ...userObject,
        quota: {
          URLs: 0,
          comments: 0,
          replies: 0,
          endTime: 0
        }
      });
    }
  }, 1 * 1000);

  // Functions:
  const handleProfilePictureUpload = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      const image = e.target.files[0];
      const extension = image.name.split('.').pop();
      const size = image.size;
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        // Image extension is unacceptable.
        console.error('Unacceptable file type.');
        setUploadError('Unsupported file type.');
        return;
      } if (size > 3000000) {
        // Image size is greater than 3 MB.
        console.error('File size too big.');
        setUploadError('File size too big.');
        return;
      }
      setUploadState(UPLOAD_STATE.UPLOADING);
      const dataURL = await getDataURL(image);
      const { result: uploadProfilePictureResult, payload: uploadProfilePicturePayload } = await uploadProfilePicture(dataURL);
      if (uploadProfilePictureResult === RESULTS.FAILURE) {
        console.error(uploadProfilePicturePayload);
      }
    }
  };

  const handleLogout = async () => {
    const { result, payload } = await logout();
    if (result === RESULTS.SUCCESS) {
      history.push(ROUTES.INDEX);
    } else {
      console.error(payload);
    }
  };

  const handleNewBabyMode = async (newMode) => {
    const { result, payload } = await updateBabyMode(newMode);
    if (result === RESULTS.FAILURE) {
      setBabyMode(!newMode);
      console.error(payload);
    }
  };
  
  const handleNewORB = async (newState) => {
    chrome.storage.sync.set({ bubbleVisibility: newState });
  };

  // Return:
  if (!auth.isAuth) {
    history.push(ROUTES.INDEX);
  }

  return (
    <Wrapper>
      <GoBack onClick={ () => history.goBack() }>
        <GoBackIcon
          src={ LEFT_CHEVRON }
          theme={ theme }
        />
        <GoBackText>Back</GoBackText>
      </GoBack>
      <Logout onClick={ handleLogout }>Log out</Logout>
      <ProfilePicture
        imageSrc={ auth.user.photoURL === null ? ACCOUNT : auth.user.photoURL }
        onClick={ () => uploadProfilePictureRef.current.click() }
        uploadState={ uploadState }
      />
      <LoadingGIF
        imageSrc={ LOADING }
        uploadState={ uploadState }
      />
      <input
        ref={ uploadProfilePictureRef }
        type='file'
        style={{
          position: 'absolute',
          top: '-1em',
          display: 'none'
        }}
        accept="image/jpg,image/jpeg,image/png,image/gif"
        onChange={ handleProfilePictureUpload }
      />
      <Username>@{ auth.user.username }</Username>
      {
        uploadError
        &&
        <UploadError>{ uploadError }</UploadError>
      }
      <QuotaSectionTitle>Quota Left</QuotaSectionTitle>
      <QuotaSection>
        <QuotaValue>
          <QuotaNumber color={ getQuotaColor(userObject.quota.URLs, QUOTA[ userObject.plan ].URLs) }>{ QUOTA[ userObject.plan ].URLs - userObject.quota.URLs }</QuotaNumber>
          <QuotaTitle>Websites</QuotaTitle>
        </QuotaValue>
        <QuotaValue>
          <QuotaNumber color={ getQuotaColor(userObject.quota.comments, QUOTA[ userObject.plan ].comments) }>{ QUOTA[ userObject.plan ].comments - userObject.quota.comments }</QuotaNumber>
          <QuotaTitle>Comments</QuotaTitle>
        </QuotaValue>
        <QuotaValue>
          <QuotaNumber color={ getQuotaColor(userObject.quota.replies, QUOTA[ userObject.plan ].replies) }>{ QUOTA[ userObject.plan ].replies - userObject.quota.replies }</QuotaNumber>
          <QuotaTitle>Replies</QuotaTitle>
        </QuotaValue>
      </QuotaSection>
      {
        quotaPeriodTimeLeft > 0
        &&
        <QuotaExpiryTimeLeft>{ prettyMilliseconds(quotaPeriodTimeLeft, { compact: true }) } left until quota period ends</QuotaExpiryTimeLeft>
      }
      <Options>
        <Option>
          <OptionText>
            <OptionTitle>Baby Mode</OptionTitle>
            <OptionDescription>Whitewash comments and replies with bad words?</OptionDescription>
          </OptionText>
          <ToggleButton
            inactiveLabel={ '' }
            activeLabel={ '' }
            colors={{
              activeThumb: {
                base: COLORS.VIRIDIAN_GREEN,
              },
              inactiveThumb: {
                base: COLORS.ULTRA_RED,
              },
              active: {
                base: COLORS.GREEN_PANTONE,
              },
              inactive: {
                base: COLORS.PERSIAN_PLUM,
              }
            }}
            trackStyle={{
              height: 15,
            }}
            thumbStyle={{
              position: 'absolute',
              width: 30,
              height: 30,
              boxShadow: `0 0 2px rgba(0,0,0,.12),0 2px 4px rgba(0,0,0,.24)`
            }}
            thumbAnimateRange={[ -10, 36 ]}
            thumbIcon={
              babyMode ?
              (
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                }}>
                  <ToggleIcon src={ CHECK } />
                </div>
              )
              :
              (
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                }}>
                  <ToggleIcon src={ CROSS } />
                </div>
              )
            }
            value={ babyMode }
            onToggle={(currentMode) => {
              setBabyMode(!currentMode);
              handleNewBabyMode(!currentMode);
            }}
          />
        </Option>
        <Option>
          <OptionText>
            <OptionTitle>Bubble Viz</OptionTitle>
            <OptionDescription>Overlay the OpenReply bubble on websites?</OptionDescription>
          </OptionText>
          <ToggleButton
            inactiveLabel={ '' }
            activeLabel={ '' }
            colors={{
              activeThumb: {
                base: COLORS.VIRIDIAN_GREEN,
              },
              inactiveThumb: {
                base: COLORS.ULTRA_RED,
              },
              active: {
                base: COLORS.GREEN_PANTONE,
              },
              inactive: {
                base: COLORS.PERSIAN_PLUM,
              }
            }}
            trackStyle={{
              height: 15,
            }}
            thumbStyle={{
              position: 'absolute',
              width: 30,
              height: 30,
              boxShadow: `0 0 2px rgba(0,0,0,.12),0 2px 4px rgba(0,0,0,.24)`
            }}
            thumbAnimateRange={[ -10, 36 ]}
            thumbIcon={
              ORB ?
              (
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                }}>
                  <ToggleIcon src={ CHECK } />
                </div>
              )
              :
              (
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                }}>
                  <ToggleIcon src={ CROSS } />
                </div>
              )
            }
            value={ ORB }
            onToggle={(currentState) => {
              setORB(!currentState);
              handleNewORB(!currentState);
            }}
          />
        </Option>
      </Options>
      <DonationText>This project is still in beta. If you want to support us and/or get a better plan, consider emailing us at <b>admin@openreply.app</b> or sending us a donation at the Monero (XMR) address: <b>83wZmJ1vBPzEaETsNDur986ASTqNeUga7TTrphMZJN6tVpju26p5DfiFvQvsEB2h2JMuz8c539k9qh2x2jB7SC5x4WwkJKX</b></DonationText>
    </Wrapper>
  );
};


// Exports:
export default Profile;
