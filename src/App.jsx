/*global chrome*/

// Packages:
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import {
  MemoryRouter as Router,
  Switch,
  Route
} from 'react-router-dom';
import useAuth from './hooks/auth';
import getDataURL from './util/getDataURL';

// props.isExt ? chrome.runtime.getURL("static/media/logo.svg")


// Imports:
import { ACCOUNT } from './assets/icons';


// Constants:
import THEMES from './styles/themes';
import COLORS from './styles/colors';
import ROUTES from './routes';
import { RESULTS } from './constants';


// Components:
import Navbar from './components/global/Navbar';
import AlertFooter from './components/global/AlertFooter';
import Home from './views/Home';
import Login from './views/Login';
import Register from './views/Register';
import Profile from './views/Profile';


// Redux:
import {
  toggleTheme,
  updateExtensionFooter,
  toggleExtensionVisibility
} from './redux/actions';


// Styles:
const Wrapper = styled.div`
  position: absolute;
  top: 0;
  width: 100vw;
  height: 100vh;
  color: ${ props => props.theme === THEMES.LIGHT ? COLORS.BLACK : COLORS.WHITE };
  background-color: ${ props => props.theme === THEMES.LIGHT ? COLORS.WHITE : COLORS.BLACK };
  overflow: hidden;
  transition: all 0.25s ease;
`;


// Functions:
const App = () => {
  // Constants:
  const dispatch = useDispatch();
  const { updateAuthState } = useAuth();

  // State:
  const theme = useSelector(state => state.theme);

  // Effects:
  useEffect(() => {
    chrome.storage.sync.get(['theme'], (result) => {
      if (result) {
        if (theme !== result.theme && [ THEMES.LIGHT, THEMES.DARK ].includes(result.theme)) {
          dispatch(toggleTheme(result.theme));
        }
      }
    });
    (async () => {
      const user = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'GET_AUTH_STATE'
          }, 
          (response) => {
          if (response.result === RESULTS.SUCCESS) {
            resolve(response.payload);
          } else if (response.result === RESULTS.FAILURE) {
            reject(response.payload);
          }
        });
      });
      if (user) {
        if (user.photoURL) {
          const photoURLResponse = await fetch(user.photoURL);
          const dataURL = await getDataURL(await photoURLResponse.blob());
          updateAuthState({
            ...user,
            photoURL: dataURL
          });
        } else {
          updateAuthState({
            ...user,
            photoURL: ACCOUNT
          });
        }
        if (!user.emailVerified) {
          dispatch(updateExtensionFooter({
            visible: true,
            title: 'Verify your account',
            description: `An email has been sent to ${ user.email }`,
            backgroundColor: COLORS.ULTRA_RED,
          }));
        } else {
          dispatch(updateExtensionFooter(null));
        }
      } else {
        dispatch(updateExtensionFooter(null));
        updateAuthState(null);
      }
    })();
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        if (message.payload) {
          (async () => {
            if (message.payload.photoURL) {
              const photoURLResponse = await fetch(message.payload.photoURL);
              const dataURL = await getDataURL(await photoURLResponse.blob());
              updateAuthState({
                ...message.payload,
                photoURL: dataURL
              });
            } else {
              updateAuthState({
                ...message.payload,
                photoURL: ACCOUNT
              });
            }
          })();
          if (!message.payload.emailVerified) {
            dispatch(updateExtensionFooter({
              visible: true,
              title: 'Verify your account',
              description: `An email has been sent to ${ message.payload.email }`,
              backgroundColor: COLORS.ULTRA_RED,
            }));
          } else {
            dispatch(updateExtensionFooter(null));
          }
        } else {
          dispatch(updateExtensionFooter(null));
          updateAuthState(null);
        }
      } if (message.type === 'B2C_TOGGLE_VISIBILITY') {
        dispatch(toggleExtensionVisibility(message.payload));
      }
    });
  }, []);

  // Return:
  return (
    <Router>
      <Wrapper theme={ theme }>
        <Navbar />
        <Switch>
          <Route exact path={ ROUTES.INDEX } component={ Home } />
          <Route path={ ROUTES.LOGIN } component={ Login } />
          <Route path={ ROUTES.REGISTER } component={ Register } />
          <Route path={ ROUTES.PROFILE } component={ Profile } />
        </Switch>
        <AlertFooter />
      </Wrapper>
    </Router>
  );
};


// Exports:
export default App;
