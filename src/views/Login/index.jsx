/*global chrome*/
// Packages:
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useInput } from '../../hooks/use-input';
import { useHistory, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/auth';
import { emailRegExp } from '../../constants/auth';
import randomLorem from 'random-lorem';


// Imports:
// import LOGO from '../../assets/SYMBOL.png';
import { LEFT_CHEVRON } from '../../assets/icons';
import CHECKMARK from '../../assets/CHECKMARK.png';


// Constants:
import COLORS from '../../styles/colors';
import ROUTES from '../../routes';
import THEMES from '../../styles/themes';
import { RESULTS } from '../../constants';


// Styles:
const Wrapper = styled.div`
  position: absolute;
  top: 8vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100vw;
  height: 92vh;
  font-size: 12px;
  transition: all 0.25s ease;
`;

const Logo = styled.img`
  width: 25%;
  margin-bottom: 3rem;
  cursor: pointer;
`;

const GoBack = styled.div`
  position: absolute;
  top: 3em;
  left: 3em;
  display: flex;
  flex-direction: row;
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

const FormContainer = styled.div`
  width: 55%;
`;

const Input = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-bottom: 1.5em;
`;

const InputBox = styled.input`
  height: 2em;
  margin-bottom: 0.5em;
  padding: 0.7em 1.5em;
  background: ${ props => props.theme === THEMES.DARK ? COLORS.CHARCOAL : COLORS.COLD_GREY };
  border: none;
  outline: none;
  color: ${ props => props.theme === THEMES.DARK ? COLORS.WHITE : COLORS.BLACK };
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 1.1em;
  border-radius: 0.5em;

  &::placeholder {
    color: ${ props => props.theme === THEMES.DARK ? COLORS.GAINSBORO : COLORS.MANATEE };
  }
`;

const Prompt = styled.div`
  margin-left: 0.2em;
  color: ${ COLORS.ULTRA_RED };
  font-weight: 600;
`;

const EmailAddress = styled(Input)``;

const Password = styled(Input)``;

const EmailAddressInput = styled(InputBox)``;

const PasswordInput = styled(InputBox)``;

const EmailAddressPrompt = styled(Prompt)``;

const PasswordPrompt = styled(Prompt)``;

const LoginPrompt = styled(Prompt)`
  margin-top: 1em;
  color: ${ COLORS.VIRIDIAN_GREEN };
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const Button = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 2em;
  padding: 0.7em 1.5em;
  background: ${ props => props.isLoading ? COLORS.LIGHT_PRIMARY : COLORS.PRIMARY };
  color: ${ props => props.isLoading ? COLORS.WHITE : props.theme === THEMES.DARK ? COLORS.BLACK : COLORS.WHITE };
  font-weight: 700;
  font-size: 1.1em;
  border-radius: 0.5em;
  user-select: none;
  cursor: pointer;

  &:focus {
    outline: 0;
  }
`;

const LoginButtonWrapper = styled(ButtonWrapper)``;

const LoginButton = styled(Button)``;

const AdditionalOptionsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 5em;
`;

const RememberMe = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1em;
  height: 1em;
  border: 1px solid ${ COLORS.MANATEE };
  border-radius: 0.2em;
  cursor: pointer;
`;

const Checkmark = styled.img`
  width: 60%;
  opacity: ${
    props => props.checkmarkTicked ? 1 : 0
  };
  filter: ${ props => props.theme === THEMES.DARK ? 'invert(100%)' : 'initial' };
  transition: all 0.2s ease;
`;

const RememberMeText = styled.div`
  display: inline-block;
  padding-left: 0.6em;
  color: ${ COLORS.MANATEE };
  font-weight: 700;
  font-size: 1em;
  user-select: none;
  cursor: pointer;
`;

const ForgotPassword = styled.div`
  float: right;
  color: ${ COLORS.PRIMARY };
  font-weight: 700;
  font-size: 1em;
  user-select: none;
  cursor: pointer;
`;

const Register = styled.div`
  position: absolute;
  bottom: 3em;
  color: ${ COLORS.MANATEE };
  font-weight: 600;
  user-select: none;
`;

const CallToAction = styled.span`
  color: ${ COLORS.PRIMARY };
  cursor: pointer;
`;


// Functions:
const Login = () => {
  // Constants:
  const history = useHistory();
  const location = useLocation();
  const { login, resetUserPassword } = useAuth();
  const DOMAINS = [ 'gmail.com', 'yahoo.com', 'post.com', 'facebook.com', 'hotmail.com', 'aol.com', 'hotmail.co.uk', 'hotmail.fr', 'googlemail.com', 'youtu.be/dQw4w9WgXcQ', window.location.origin.split('//')[1], 'kirak32.in' ];

  // State:
  const { theme, auth } = useSelector(state => state);
  const locationState = location.state === undefined ? { message: '' } : location.state;
  const { value: emailAddress, bind: bindEmailAddress } = useInput('');
  const { value: password, bind: bindPassword } = useInput('');
  const [ emailAddressPrompt, setEmailAddressPrompt ] = useState('');
  const [ passwordPrompt, setPasswordPrompt ] = useState('');
  const [ loginPrompt, setLoginPrompt ] = useState(locationState.message);
  const [ rememberMe, setRememberMe ] = useState(false);
  const [ isLoading, setIsLoading ] = useState(false);

  // Effects:
  useEffect(() => {
    if (auth.loaded) {
      if (auth.isAuth) {
        history.push(ROUTES.PROFILE);
      }
    }
  }, [ auth.loaded, auth.isAuth, history ]);

  // Functions:
  const validateInputs = () => {
    let result = RESULTS.SUCCESS;
    setEmailAddressPrompt('');
    setPasswordPrompt('');
    setLoginPrompt('');
    if (emailAddress === '' || !emailRegExp.test(emailAddress) || emailAddress.length > 100) {
      setEmailAddressPrompt('Invalid email.');
      result = RESULTS.FAILURE;
    } if (password === '' || password.length > 40) {
      setPasswordPrompt('Invalid password.');
      result = RESULTS.FAILURE;
    }
    return result;
  };

  const handleLogin = async () => {
    if (!isLoading) {
      setIsLoading(true);
      const validationResult = validateInputs();
      if (validationResult === RESULTS.SUCCESS) {
        const { result: loginResult, payload: loginPayload } = await login(emailAddress, password);
        if (loginResult === RESULTS.SUCCESS) {
          history.push(ROUTES.INDEX);
        } else {
          if (loginPayload) {
            if (loginPayload.code === 'email-not-verified') {
              setLoginPrompt('Check your inbox for an account verification email.');
            } else {
              switch (loginPayload.payload.code) {
                case 'auth/user-not-found':
                  setLoginPrompt('No account exists with this email address.');
                  break;
                case 'auth/wrong-password':
                  setLoginPrompt(`You have entered ${ randomLorem() + '@' + DOMAINS[Math.floor(Math.random() * DOMAINS.length)] }'s password. Please enter ${ emailAddress }'s password.`);
                  break;
                case 'auth/too-many-requests':
                  setLoginPrompt('yo slow tf down');
                  break;
                default:
                  setLoginPrompt('Something wen\'t wrong. :/');
                  console.error(loginPayload);
                  break;
              }
            }
          } else {
            setLoginPrompt('Something wen\'t wrong. :/');
            console.error(loginPayload);
          }
        }
      }
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    setLoginPrompt('');
    if (emailAddress === '' || !emailRegExp.test(emailAddress) || emailAddress.length > 100) {
      setEmailAddressPrompt('Invalid email.');
    } else {
      const { result: resetUserPasswordResult, payload: resetUserPasswordPayload } = await resetUserPassword(emailAddress);
      if (resetUserPasswordResult === RESULTS.SUCCESS) {
        setLoginPrompt(`A password reset email has been sent to your address ${ emailAddress }.`);
      } else {
        console.error('Please report this error: ', resetUserPasswordPayload);
      }
    }
  };

  // Return:
  return (
    <Wrapper>
      <Logo
        src={ chrome.runtime.getURL('static/media/SYMBOL.png') }
        onClick={ () => history.push(ROUTES.INDEX) }
      />
      <GoBack onClick={ () => history.push(ROUTES.INDEX) }>
        <GoBackIcon
          src={ LEFT_CHEVRON }
          theme={ theme }
        />
        <GoBackText>Back</GoBackText>
      </GoBack>
      <FormContainer>
        <EmailAddress>
          <EmailAddressInput
            type="text"
            placeholder="Email Address"
            theme={ theme }
            { ...bindEmailAddress }
          />
          <EmailAddressPrompt>{ emailAddressPrompt }</EmailAddressPrompt>
        </EmailAddress>
        <Password>
          <PasswordInput
            type="password"
            placeholder="Password"
            theme={ theme }
            { ...bindPassword }
          />
          <PasswordPrompt>{ passwordPrompt }</PasswordPrompt>
        </Password>
        <LoginButtonWrapper onClick={ handleLogin }>
          <LoginButton
            tabIndex={ 0 }
            theme={ theme }
            isLoading={ isLoading }
          >
            Login
          </LoginButton>
        </LoginButtonWrapper>
        <LoginPrompt>{ loginPrompt }</LoginPrompt>
        <AdditionalOptionsWrapper>
          <RememberMe onClick={ () => setRememberMe(!rememberMe) }>
            <Checkbox>
              <Checkmark
                src={ CHECKMARK }
                checkmarkTicked={ rememberMe }
                theme={ theme }
              />
            </Checkbox>
            <RememberMeText>Remember Me</RememberMeText>
          </RememberMe>
          <ForgotPassword onClick={ handleForgotPassword }>Forgot password?</ForgotPassword>
        </AdditionalOptionsWrapper>
      </FormContainer>
      <Register
        onClick={ () => history.push(ROUTES.REGISTER) }
      >
        Join the world's largest AboveNet - <CallToAction>Register now</CallToAction>
      </Register>
    </Wrapper>
  );
};


// Exports:
export default Login;