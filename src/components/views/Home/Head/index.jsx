// Packages:
import React, { useState } from 'react';
import styled from 'styled-components';
import { useInterval } from 'react-use';
import truncate from 'truncate';
import { useSelector } from 'react-redux';


// Constants:
import COLORS from '../../../../styles/colors';


// Components:
import Vote from '../../../global/Vote';


// Styles:
const Wrapper = styled.div`
  position: fixed;
  top: 8vh;
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 100%;
  height: 15vh;
`;

const TextWrapper = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 90%;
  height: 100%;
`;

const Title = styled.div`
  display: inline-block;
  width: 90%;
  font-weight: 600;
  font-size: 1.5em;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const Description = styled.div`
  display: inline-block;
  margin-top: 0.3em;
  margin-left: 0.2em;
  font-weight: 400;
  font-size: 1em;
  color: ${ COLORS.CHARCOAL };
`;

const NoDescriptionProvided = styled.div`
  font-style: italic;
  color: ${ COLORS.SONIC_SILVER };
`;


// Functions:
const Head = (props) => {
  // State:
  const isAuth = useSelector(state => state.auth.isAuth);
  const [ documentTitle, setDocumentTitle ] = useState('');
  const [ metaDescription, setMetaDescription ] = useState('');

  // Effects:
  useInterval(() => {
    const newDocumentTitle = document.title;
    const descriptionObj = document.getElementsByTagName('meta').Description;
    const newMetaDescription = descriptionObj === undefined ? '' : descriptionObj.content;
    if (newDocumentTitle !== documentTitle) {
      setDocumentTitle(newDocumentTitle);
    }
    if (newMetaDescription !== metaDescription) {
      setMetaDescription(newMetaDescription);
    }
  }, 10 * 1000);

  // Return:
  return (
    <Wrapper>
      <Vote
        vote={ props.URLDetails.userVote }
        totalVote={ props.URLDetails.totalVote }
        canVote={ isAuth }
        URLDetailsLoaded={ props.URLDetailsLoaded }
      />
      <TextWrapper>
        <Title>{ truncate(document.title, 35) }</Title>
        <Description>{ metaDescription === '' ? <NoDescriptionProvided>No description provided.</NoDescriptionProvided> : truncate(metaDescription, 50) }</Description>
      </TextWrapper>
    </Wrapper>
  );
};


// Exports:
export default Head;
