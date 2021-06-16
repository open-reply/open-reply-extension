/*global chrome*/
// Packages:
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useInput } from '../../hooks/use-input';
import { useHistory } from 'react-router-dom';
import useAuth from '../../hooks/auth';
import { emailRegExp, usernameRegExp } from '../../constants/auth';


// Imports:
// import LOGO from '../../assets/SYMBOL.png';
import { LEFT_CHEVRON } from '../../assets/icons';


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

const Username = styled(Input)``;

const Password = styled(Input)``;

const EmailAddressInput = styled(InputBox)``;

const UsernameInput = styled(InputBox)`
  text-transform: lowercase;
`;

const PasswordInput = styled(InputBox)``;

const UsernamePrompt = styled(Prompt)``;

const EmailAddressPrompt = styled(Prompt)``;

const PasswordPrompt = styled(Prompt)``;

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

const RegisterButtonWrapper = styled(ButtonWrapper)``;

const RegisterButton = styled(Button)``;

const Login = styled.div`
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
const Register = () => {
  // Constants:
  const history = useHistory();
  const { register } = useAuth();

  // State:
  const { theme, auth } = useSelector(state => state);
  const { value: emailAddress, bind: bindEmailAddress } = useInput('');
  const { value: username, bind: bindUsername } = useInput('');
  const { value: password, bind: bindPassword } = useInput('');
  const [ emailAddressPrompt, setEmailAddressPrompt ] = useState('');
  const [ usernamePrompt, setUsernamePrompt ] = useState('');
  const [ passwordPrompt, setPasswordPrompt ] = useState('');
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
    setUsernamePrompt('');
    setPasswordPrompt('');

    if (emailAddress === '' || !emailRegExp.test(emailAddress) || emailAddress.length > 100) {
      setEmailAddressPrompt('Invalid email.');
      result = RESULTS.FAILURE;
    } if (username === '' || !usernameRegExp.test(username) || username.length < 5 || username.length > 40) {
      setUsernamePrompt('Invalid username.');
      result = RESULTS.FAILURE;
    } if (password === '' || password.length > 40) {
      setPasswordPrompt('Invalid password.');
      result = RESULTS.FAILURE;
    }
    return result;
  };

  const handleRegister = async () => {
    if (!isLoading) {
      setIsLoading(true);
      const validationResult = validateInputs();
      if (validationResult === RESULTS.SUCCESS) {
        const { result: registerResult, payload: registerPayload } = await register(emailAddress, username.toLowerCase(), password);
        if (registerResult === RESULTS.SUCCESS) {
          history.push({
            pathname: ROUTES.LOGIN,
            state: {
              message: 'Check your inbox for an account verification email.'
            }
          });
        } else {
          if (registerPayload.code === 'username-taken' || registerPayload.code === 'email-in-use') {
            if (registerPayload.code === 'username-taken') {
              setUsernamePrompt(registerPayload.message);
            } if (registerPayload.code === 'email-in-use') {
              setEmailAddressPrompt(registerPayload.message);
            }
          } else {
            setPasswordPrompt('Something wen\'t wrong. :/');
            console.error(registerPayload);
          }
        }
      }
    }
    setIsLoading(false);
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
          <EmailAddressPrompt >{ emailAddressPrompt }</EmailAddressPrompt>
        </EmailAddress>
        <Username>
          <UsernameInput
            type="text"
            placeholder="Username"
            theme={ theme }
            { ...bindUsername }
          />
          <UsernamePrompt >{ usernamePrompt }</UsernamePrompt>
        </Username>
        <Password>
          <PasswordInput
            type="password"
            placeholder="Password"
            theme={ theme }
            { ...bindPassword }
          />
          <PasswordPrompt>{ passwordPrompt }</PasswordPrompt>
        </Password>
        <RegisterButtonWrapper onClick={ handleRegister }>
          <RegisterButton
            tabIndex={ 0 }
            theme={ theme }
            isLoading={ isLoading }
          >
            Register
          </RegisterButton>
        </RegisterButtonWrapper>
      </FormContainer>
      <Login
        onClick={ () => history.push(ROUTES.LOGIN) }
      >
        Already have an account? - <CallToAction>Login</CallToAction>
      </Login>
    </Wrapper>
  );
};


// Exports:
export default Register;