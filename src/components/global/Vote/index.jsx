// Packages:
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import humanFormat from 'human-format';
import useDatabase from '../../../hooks/database';
import sanitizeURL from '../../../util/url-sanitize';
import kirak32 from '../../../util/kirak32';
import { useSelector } from 'react-redux';
import { useDebounce } from 'react-use';


// Imports:
import { ARROW } from '../../../assets/icons';


// Constants:
import { DOWNVOTE, NOVOTE, UPVOTE } from '../../../constants/voting';
import COLORS from '../../../styles/colors';
import { RESULTS } from '../../../constants';


// Styles:
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 10%;
  height: 100%;
`;

const Arrow = styled.img`
  width: 1em;
  margin: 0.75em;
  cursor: ${ props => props.canVote ? 'pointer' : 'default' };
  user-select: none;
`;

const UpArrow = styled(Arrow)`
  filter: ${
    props => props.canVote ? (
      props.isSelected ?
      'invert(52%) sepia(47%) saturate(5605%) hue-rotate(153deg) brightness(93%) contrast(87%)'
      :
      'invert(45%) sepia(10%) saturate(450%) hue-rotate(192deg) brightness(92%) contrast(90%)'
    )
    :
    'invert(92%) sepia(15%) saturate(50%) hue-rotate(143deg) brightness(99%) contrast(84%)'
  };
  transform: rotate(180deg);
  transition: filter 150ms ease;

  &:hover {
    filter: ${
      props => props.canVote ? (
        props.isSelected ?
        'invert(52%) sepia(47%) saturate(5605%) hue-rotate(153deg) brightness(99%) contrast(87%)'
        :
        'invert(23%) sepia(4%) saturate(1922%) hue-rotate(190deg) brightness(98%) contrast(86%)'
      )
      :
      'invert(92%) sepia(15%) saturate(50%) hue-rotate(143deg) brightness(99%) contrast(84%)'
    };
    transition: filter 150ms ease;
  }
`;

const VoteNumber = styled.div`
  display: inline-block;
  color: ${ props => props.canVote ? (props.vote === NOVOTE ? 'inherit' : props.vote === UPVOTE ? COLORS.VIRIDIAN_GREEN : COLORS.ULTRA_RED) : COLORS.SONIC_SILVER };
  font-weight: 600;
  font-size: 0.9em;
`;

const DownArrow = styled(Arrow)`
  filter: ${
    props => props.canVote ? (
      props.isSelected ?
      'invert(74%) sepia(51%) saturate(4670%) hue-rotate(305deg) brightness(99%) contrast(95%)'
      :
      'invert(45%) sepia(10%) saturate(450%) hue-rotate(192deg) brightness(92%) contrast(90%)'
    )
    :
    'invert(92%) sepia(15%) saturate(50%) hue-rotate(143deg) brightness(99%) contrast(84%)'
  };
  transition: filter 150ms ease;

  &:hover {
    filter: ${
      props => props.canVote ? (
        props.isSelected ? 
        'invert(74%) sepia(51%) saturate(4670%) hue-rotate(300deg) brightness(99%) contrast(95%)'
        :
        'invert(23%) sepia(4%) saturate(1922%) hue-rotate(190deg) brightness(98%) contrast(86%)'
      )
      :
      'invert(92%) sepia(15%) saturate(50%) hue-rotate(143deg) brightness(99%) contrast(84%)'
    };
    transition: filter 150ms ease;
  }
`;


// Functions:
const Vote = (props) => {
  // State:
  const isAuth = useSelector(state => state.auth.isAuth);
  const { voteURL } = useDatabase();
  const [ voteState, setVoteState ] = useState({
    vote: props.vote,
    totalVote: props.totalVote,
    oldVote: props.vote,
    oldTotalVote: props.totalVote,
    databaseVote: props.vote
  });
  const [ postingVote, setPostingVote ] = useState(false);
  const [ voteDebounce, triggerVoteDebounce ] = useState(null);

  // Effects:
  useEffect(() => {
    if (!props.URLDetailsLoaded) {
      let newVoteState = voteState.vote !== props.vote ? { ...voteState, vote: props.vote } : voteState;
      newVoteState = voteState.totalVote !== props.totalVote ? { ...newVoteState, totalVote: props.totalVote } : newVoteState;
      setVoteState(newVoteState);
    }
  }, [ props.vote, props.totalVote, voteState, props.URLDetailsLoaded ]);
  
  const [ isVoteDebounceReady, cancelVoteDebounce ] = useDebounce(async () => {
    if (voteDebounce !== null) {
      if (voteState.vote !== voteState.databaseVote) {
        setPostingVote(true);
        const { result: handleVoteResult, payload: handleVotePayload } = await voteURL(voteState.vote === 0 ? voteState.oldVote : voteState.vote, kirak32(sanitizeURL(window.location.href)));
        setPostingVote(false);
        if (handleVoteResult === RESULTS.FAILURE) {
          setVoteState({ ...voteState, vote: voteState.oldVote, totalVote: voteState.oldTotalVote });
          console.error(handleVotePayload);
        } else {
          setVoteState({ ...voteState, databaseVote: voteState.vote });
        }
      }
    }
  }, 5000, [ voteDebounce ]);

  // Functions:
  const handleVote = async (newVote) => {
    if (!isVoteDebounceReady()) {
      cancelVoteDebounce();
    } if (!postingVote) {
      let newVoteState = { ...voteState, oldVote: voteState.vote, oldTotalVote: voteState.totalVote };
      if (voteState.vote === NOVOTE) {
        newVoteState = {
          ...newVoteState,
          totalVote: newVote === UPVOTE ? voteState.totalVote + 1 : voteState.totalVote - 1,
          vote: newVote
        };
      } else {
        if (newVote === voteState.vote) {
          newVoteState = {
            ...newVoteState,
            totalVote: newVote === UPVOTE ? voteState.totalVote - 1 : voteState.totalVote + 1,
            vote: NOVOTE
          };
        } else {
          newVoteState = {
            ...newVoteState,
            totalVote: newVote === UPVOTE ? voteState.totalVote + 2 : voteState.totalVote - 2,
            vote: newVote
          };
        }
      }
      setVoteState(newVoteState);
      triggerVoteDebounce(voteDebounce === null ? true : !voteDebounce);
    }
  };

  // Return:
  return (
    <Wrapper>
      <UpArrow
        src={ ARROW }
        canVote={ isAuth }
        isSelected={ voteState.vote === UPVOTE ? true : false }
        onClick={ () => handleVote(UPVOTE) }
      />
      <VoteNumber
        vote={ voteState.vote }
        canVote={ isAuth }
      >
        { humanFormat(voteState.totalVote, { decimals: 1, separator: '' }) }
      </VoteNumber>
      <DownArrow
        src={ ARROW }
        canVote={ isAuth }
        isSelected={ voteState.vote === DOWNVOTE ? true : false }
        onClick={ () => handleVote(DOWNVOTE) }
      />
    </Wrapper>
  );
};


// Exports:
export default Vote;
