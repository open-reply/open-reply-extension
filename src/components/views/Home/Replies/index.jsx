// Packages:
import React from 'react';
import styled from 'styled-components';


// Imports:
import { LEFT_CHEVRON, LOADING } from '../../../../assets/icons';


// Constants:
import COLORS from '../../../../styles/colors';


// Components:
import Reply from '../Reply';


// Styles:
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
`;

const RepliesBody = styled.div`
  width: 100%;
  height: 78%;
`;

const ShowMore = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  width: 100%;
  height: 3em;
  font-weight: 700;
  font-size: 1.1em;
  color: ${ COLORS.PRIMARY };
  user-select: none;
  cursor: pointer;
`;

const ArrowIcon = styled.img`
  width: 0.9em;
  margin-right: 0.5em;
  filter: invert(30%) sepia(99%) saturate(1129%) hue-rotate(178deg) brightness(97%) contrast(95%);
  transform: rotate(-90deg);
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 5em;
`;

const LoadingGIF = styled.img`
  width: 3em;
`;


// Functions:
const Replies = (props) => {
  return (
    <Wrapper>
      <RepliesBody>
        {
          props.replies.map((reply) => (
            <Reply
              key={ reply.ID }
              reply={{
                ID: reply.ID,
                author: reply.author,
                authorUID: reply.authorUID,
                createdOn: reply.createdOn,
                body: reply.body,
                userVote: reply.userVote,
                upVotes: reply.upVotes,
                downVotes: reply.downVotes,
                flagged: reply.flagged,
                decorators: []
              }}
              handleChildVoteReply={ props.handleChildVoteReply }
              handleChildPostReply={ props.handleChildPostReply }
              handleChildDeleteReply={ props.handleChildDeleteReply }
              commentID={ props.commentID }
            />
          ))
        }
        {
          props.replies.length !== props.totalReplies
          &&
          (
            props.showMoreReplies
            ?
            <ShowMore onClick={ props.loadMoreReplies }>
              <ArrowIcon src={ LEFT_CHEVRON } />
              Show More
            </ShowMore>
            :
            <LoadingWrapper>
              <LoadingGIF src={ LOADING } />
            </LoadingWrapper>
          )
        }
      </RepliesBody>
    </Wrapper>
  );
};


// Exports:
export default Replies;
