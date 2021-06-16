/*global chrome*/

// Packages:
import React from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';


// Imports:
import BULB_DARK_MODE from '../../../assets/BULB_DARK_MODE.png';
import BULB_LIGHT_MODE from '../../../assets/BULB_LIGHT_MODE.png';
import { ACCOUNT } from '../../../assets/icons';


// Constants:
import { TOGGLE_THEME } from '../../../redux/action-types';
import COLORS from '../../../styles/colors';
import THEMES from '../../../styles/themes';
import ROUTES from '../../../routes';


// Styles:
const Wrapper = styled.div`
  position: fixed;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-direction: row;
  width: 100%;
  height: 8vh;
  box-shadow: 0px 0px 20px -15px ${ props => props.theme === THEMES.LIGHT ? COLORS.BLACK : COLORS.WHITE };
  user-select: none;
`;

const ThemeBulbWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.5em;
  height: 1.5em;
`;

const Glow = styled.div`
  width: 0px;
  height: 0px;
  box-shadow: ${ props => props.theme === THEMES.DARK ? '0px 0px 30px 10px #fdca40' : 'initial' };
  transition: all 0.25s ease;
`;

const ThemeBulb = styled.img`
  position: absolute;
  display: inline-block;
  width: 1.5em;
  cursor: pointer;
`;

const Logo = styled.a`
  font-weight: 700;
  font-size: 1.5em;
  color: ${ COLORS.PRIMARY };
  cursor: pointer;
  text-decoration: none;
`;

const User = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.5em;
  height: 1.5em;
`;

const UserIcon = styled.div`
  width: 1.5em;
  height: 1.5em;
  background-image: ${ props => 'url("' + props.imageSrc + '")' };
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  cursor: pointer;  
`;


// Functions:
const Navbar = () => {
  // Constants:
  const history = useHistory();
  const dispatch = useDispatch();

  // State:
  const theme = useSelector(state => state.theme);
  const isAuth = useSelector(state => state.auth.isAuth);
  const photoURL = useSelector(state => state.auth.user.photoURL);

  // Functions:
  const updateTheme = (oldTheme) => {
    if (oldTheme === THEMES.LIGHT) {
      dispatch({ type: TOGGLE_THEME, payload: THEMES.DARK });
      chrome.storage.sync.set({ theme: THEMES.DARK });
    } else {
      dispatch({ type: TOGGLE_THEME, payload: THEMES.LIGHT });
      chrome.storage.sync.set({ theme: THEMES.LIGHT });
    }
  };

  const handleProfileClick = () => {
    if (isAuth) {
      history.push(ROUTES.PROFILE);
    } else {
      history.push(ROUTES.LOGIN);
    }
  };

  // Return:
  return (
    <Wrapper theme={ theme }>
      <ThemeBulbWrapper>
        <Glow theme={ theme } />
        <ThemeBulb
          src={ theme === THEMES.LIGHT ? BULB_LIGHT_MODE : BULB_DARK_MODE }
          onClick={ () => updateTheme(theme) }
        />
      </ThemeBulbWrapper>
      <Logo href='https://openreply.app' rel='noopener noreferrer' target='_blank'>OpenReply</Logo>
      <User onClick={ handleProfileClick }>
        <UserIcon
          imageSrc={ photoURL === null ? ACCOUNT : photoURL }
        />
      </User>
    </Wrapper>
  );
};


// Exports:
export default Navbar;
