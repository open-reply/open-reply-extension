// Packages:
import React from 'react';
import styled from 'styled-components';
import truncate from 'truncate';
import { useSelector, useDispatch } from 'react-redux';


// Constants:
import THEMES from '../../../styles/themes';
import COLORS from '../../../styles/colors';


// Redux:
import { updateExtensionFooter } from '../../../redux/actions';


// Styles:
const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  width: 100%;
  height: 4vh;
  color: ${ props => props.textColor === null ? (props.theme === THEMES.DARK ? COLORS.BLACK : COLORS.WHITE) : props.textColor };
  font-size: 1em;
  background-color: ${ props => props.backgroundColor };
  user-select: none;
`;

const Icon = styled.img`
  width: 1em;
  margin-right: 0.3em;
`;

const Title = styled.div`
  margin-right: 0.5em;
  font-weight: 700;
`;

const Description = styled.div``;

const OK = styled.div`
  position: absolute;
  right: 1em;
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.1em 1em;
  border: 1px solid white;
  border-radius: 0.3em;
  user-select: none;
  cursor: pointer;
`;


// Functions:
const AlertFooter = () => {
  // Constants:
  const dispatch = useDispatch();

  // State:
  const theme = useSelector(state => state.theme);
  const footer = useSelector(state => state.extension.footer);

  // Return:
  return (
    <>
      {
        footer.visible
        &&
        <Wrapper
          theme={ theme }
          backgroundColor={ footer.backgroundColor }
          textColor={ footer.color }
        >
          <Icon src={ footer.icon } />
          <Title>{ footer.title }</Title>
          <Description>{ truncate(footer.description, 30) }</Description>
          {
            footer.showOK
            &&
            <OK onClick={ () => dispatch(updateExtensionFooter(null)) }>OK</OK>
          }
        </Wrapper>
      }
    </>
  );
};


// Exports:
export default AlertFooter;
