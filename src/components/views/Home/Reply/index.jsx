// Packages:
import React, { useState, useMemo, useRef, useEffect } from 'react';
import styled from 'styled-components';
import truncate from 'truncate';
import nl2br from '../../../../util/nl2br';
import superTrunc, { newLineCounter } from '../../../../util/supertrunc';
import TextareaAutosize from 'react-textarea-autosize';
import { useInput } from '../../../../hooks/use-input';
import { useSelector } from 'react-redux';
import prettyMilliseconds from 'pretty-ms';
import useDatabase from '../../../../hooks/database';
import useBucket from '../../../../hooks/bucket';
import sanitizeURL from '../../../../util/url-sanitize';
import kirak32 from '../../../../util/kirak32';
import getDataURL from '../../../../util/getDataURL';
import { useDebounce } from 'react-use';
import { useHistory } from 'react-router-dom';


// Imports:
import { ACCOUNT, ARROW, DELETE, FLAG, LOADING } from '../../../../assets/icons';


// Constants:
import COLORS from '../../../../styles/colors';
import THEMES from '../../../../styles/themes';
import ROUTES from '../../../../routes';
import { NOVOTE, UPVOTE, DOWNVOTE } from '../../../../constants/voting';
import { RESULTS } from '../../../../constants';


// Styles:
const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const ProfilePictureArea = styled.div`
  width: 6%;
  margin: 0.5em 0.5em 1em 0em;
`;

const ProfilePicture = styled.div`
  width: 2em;
  height: 2em;
  background-image: ${ props => 'url("' + props.imageSrc + '")' };
  background-size: cover;
  background-position: center;
  border-radius: 50%;
`;

const ReplyArea = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 85%;
  margin: 1em 0em;
  margin-top: 0.5em;
`;

const ReplyMain = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ReplyDetails = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 100%;
  height: 1.5em;
`;

const ReplyAuthor = styled.a`
  display: inline-block;
  color: inherit;
  font-weight: 600;
  font-size: 1em;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    color: ${ COLORS.PRIMARY };
    transition: all 0.25s ease;
  }
`;

const ReplyTime = styled.div`
  display: inline-block;
  margin-left: 0.5em;
  color: ${ COLORS.SONIC_SILVER };
  font-weight: 700;
  font-size: 1em;
  user-select: none;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    color: ${ COLORS.PRIMARY };
    transition: all 0.25s ease;
  }
`;

const ReplyDecorators = styled.div`
  display: inline-block;
  margin-left: 0.5em;
  font-weight: 600;
  font-size: 0.8em;
`;

const ReplyDecorator = styled.div`
  display: inline-block;
  margin-right: 0.5em;
  padding: 0.25em 0.4em;
  border-radius: 0.2em;
  user-select: none;
  cursor: pointer;
`;

const ReplyBody = styled.div`
  width: 100%;
  margin-top: 0.5em;
  color: ${ props => props.flagged ? (props.theme === THEMES.LIGHT ? COLORS.BLACK : COLORS.WHITE) : 'inherit' };
  font-weight: 500;
  background-color: ${ props => props.flagged ? (props.theme === THEMES.LIGHT ? COLORS.BLACK : COLORS.WHITE) : 'inherit' };
  transition: all 0.25s ease;

  &:hover {
    background-color: initial;
    transition: all 0.25s ease;
  }
`;

const ReadAction = styled.div`
  width: 7em;
  margin-top: 0.2em;
  color: ${ COLORS.SONIC_SILVER };
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    color: ${ COLORS.PRIMARY };
    text-decoration: underline;
    transition: all 0.25s ease;
  }
`;

const ReplyOptions = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 100%;
  margin-top: 0.3em;
`;

const VoteWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1em;
`;

const VoteIcon = styled.img`
  width: 1em;
  margin: 0.75em;
  margin-left: 0;
  cursor: ${ props => props.canVote ? 'pointer' : 'default' };
  user-select: none;
`;

const UpvoteIcon = styled(VoteIcon)`
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

const DownvoteIcon = styled(VoteIcon)`
  margin-left: 1em;
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

const VoteNumber = styled.div`
  font-weight: 600;
  transition: all 0.25s ease;
`;

const UpvoteNumber = styled(VoteNumber)`
  color: ${ props => props.isSelected ? COLORS.VIRIDIAN_GREEN : COLORS.MANATEE };
`;

const DownvoteNumber = styled(VoteNumber)`
  color: ${ props => props.isSelected ? COLORS.ULTRA_RED : COLORS.MANATEE };
`;

const ReplyText = styled.div`
  margin-left: 2em;
  color: ${ props => props.isAuth ? (props.replyBoxVisibility ? COLORS.ULTRA_RED : COLORS.SONIC_SILVER) : COLORS.SONIC_SILVER };
  font-weight: 600;
  user-select: none;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    color: ${ props => props.isAuth ? (props.replyBoxVisibility ? COLORS.ULTRA_RED : COLORS.PRIMARY) : COLORS.SONIC_SILVER };
    transition: all 0.25s ease;
  }
`;

const DeleteIcon = styled.img`
  width: 1em;
  margin-left: 3em;
  filter: invert(45%) sepia(10%) saturate(450%) hue-rotate(192deg) brightness(92%) contrast(90%);
  cursor: pointer;
  user-select: none;

  &:hover {
    filter: invert(55%) sepia(17%) saturate(1726%) hue-rotate(298deg) brightness(102%) contrast(94%);
    transition: filter 150ms ease;
  }
`;

const FlagIcon = styled.img`
  width: 1em;
  margin-left: 3em;
  filter: ${ props => props.isReplyFlagged ? 'invert(55%) sepia(17%) saturate(1726%) hue-rotate(298deg) brightness(102%) contrast(94%)' : 'invert(45%) sepia(10%) saturate(450%) hue-rotate(192deg) brightness(92%) contrast(90%)' };
  cursor: pointer;
  user-select: none;

  &:hover {
    filter: ${ props => props.isReplyFlagged ? 'invert(55%) sepia(17%) saturate(1726%) hue-rotate(298deg) brightness(102%) contrast(94%)' : 'invert(23%) sepia(4%) saturate(1922%) hue-rotate(190deg) brightness(98%) contrast(86%)' };
    transition: filter 150ms ease;
  }
`;

const WriteAReply = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 100%;
  margin: 1em 0em;
  margin-bottom: 1.5em;
`;

const ReplyBox = styled(TextareaAutosize)`
  width: 85%;
  margin-left: 1.5em;
  padding: 0.5em 0.5em 0.7em 0.1em;
  background: none;
  color: ${ props => props.theme === THEMES.DARK ? COLORS.WHITE : COLORS.BLACK };
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 1em;
  border: none;
  border-bottom: 2px solid ${ COLORS.CHARCOAL };
  outline: none;
  resize: none;
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: all 0.25s ease;

  &:focus {
    border-bottom: 2px solid ${ props => props.theme === THEMES.DARK ? COLORS.WHITE : COLORS.BLACK };
    transition: all 0.25s ease;
  }

  ::-webkit-scrollbar {
    display: none;
  }
`;

const PostReplyWrapper = styled.div`
  display: flex;
  flex-direction: row-reverse;
  width: 85%;
`;

const PostReplyButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 4em;
  height: 1em;
  padding: 0.8em 1.8em;
  background: ${ props => props.canReply ? COLORS.PRIMARY : props.theme === THEMES.DARK ? COLORS.GUNMETAL : COLORS.COLD_GREY };
  color: ${ props => props.theme === THEMES.DARK ? COLORS.BLACK : COLORS.WHITE };
  font-weight: 700;
  font-size: 1em;
  border-radius: 0.3em;
  user-select: none;
  cursor: ${ props => props.canReply ? 'pointer' : 'default' };
  transition: all 0.25s ease;

  &:focus {
    outline: 0;
  }
`;

const ErrorText = styled.div`
  margin: 0 2rem;
  color: ${ COLORS.ULTRA_RED };
  font-weight: 600;
  font-size: 1em;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 10em;
`;

const LoadingGIF = styled.img`
  width: 3em;
`;

const ButtonLoadingWrapper = styled(LoadingWrapper)`
  height: initial;
`;

const ButtonLoadingGIF = styled(LoadingGIF)`
  width: 1.5em;
`;


// Functions:
const Reply = (props) => {
  // Constants:
  const history = useHistory();
  const { voteReply, deleteReply, flagReply } = useDatabase();
  const { downloadProfilePicture } = useBucket();

  // State:
  const theme = useSelector(state => state.theme);
  const isAuth = useSelector(state => state.auth.isAuth);
  const authUser = useSelector(state => state.auth.user);
  const databaseUser = useSelector(state => state.database.user);
  const [ showFullReply, setShowFullReply ] = useState(false);
  const [ showReadAction, toggleReadAction ] = useState(false);
  const [ voteState, setVoteState ] = useState({
    userVote: props.reply.userVote,
    upVotes: props.reply.upVotes,
    downVotes: props.reply.downVotes,
    oldUserVote: props.reply.userVote,
    oldUpVotes: props.reply.upVotes,
    oldDownVotes: props.reply.downVotes,
    databaseVote: props.reply.userVote
  });
  const [ replyBoxVisibility, toggleReplyBoxVisibility ] = useState(false);
  const { value: reply, reset: resetReply, bind: bindReply } = useInput('');
  const [ canReply, setCanReply ] = useState(false);
  const [ isPostingReply, setIsPostingReply ] = useState(false);
  const [ isReplyFlagged, setReplyFlag ] = useState(false);
  const [ profilePicture, setProfilePicture ] = useState(ACCOUNT);
  const [ postingVote, setPostingVote ] = useState(false);
  const [ voteDebounce, triggerVoteDebounce ] = useState(null);
  const [ errorText, setErrorText ] = useState('');

  // Memo:
  const replyBody = useMemo(() => {
    return showFullReply ? nl2br(props.reply.body) : nl2br(superTrunc(props.reply.body, { charLimit: 200, newLineLimit: 2 }));
  }, [props.reply.body, showFullReply]);

  // Ref:
  const replyBoxRef = useRef(null);

  // Effects:
  useEffect(() => {
    if (authUser.username === props.reply.author) {
      setProfilePicture(authUser.photoURL === null ? ACCOUNT : authUser.photoURL);
    } else {
      (async () => {
        const { result: downloadProfilePictureResult, payload: downloadProfilePicturePayload } = await downloadProfilePicture(props.reply.authorUID);
        if (downloadProfilePictureResult === RESULTS.SUCCESS) {
          const photoURLResponse = await fetch(downloadProfilePicturePayload);
          const dataURL = await getDataURL(await photoURLResponse.blob());
          setProfilePicture(dataURL);
        }
      })();
    }
  }, []);

  useEffect(() => {
    setShowFullReply(!((props.reply.body.length > 400) || (newLineCounter(props.reply.body) > 2)));
    toggleReadAction((props.reply.body.length > 400) || (newLineCounter(props.reply.body) > 2));
  }, [ props.reply.body ]);

  useEffect(() => {
    if (replyBoxVisibility) {
      replyBoxRef.current.focus();
      replyBoxRef.current.value = `@${ props.reply.author } `;
    } else {
      resetReply();
    }
  }, [ props.reply.author, replyBoxVisibility ]);

  useEffect(() => {
    if (reply.length > 0) {
      setCanReply(true);
    } else {
      setCanReply(false);
    }
  }, [reply]);

  const [ isVoteDebounceReady, cancelVoteDebounce ] = useDebounce(async () => {
    if (voteDebounce !== null) {
      if (voteState.userVote !== voteState.databaseVote) {
        setPostingVote(true);
        const { result: voteReplyResult, payload: voteReplyPayload } = await voteReply(voteState.userVote === 0 ? voteState.oldUserVote : voteState.userVote, props.reply.ID, props.commentID, kirak32(sanitizeURL(window.location.href)));
        setPostingVote(false);
        if (voteReplyResult === RESULTS.FAILURE) {
          setVoteState({ ...voteState, userVote: voteState.oldUserVote });
          props.handleChildVoteReply(voteState.oldUpVotes, voteState.oldDownVotes, voteState.oldUserVote, props.reply.ID);
          console.error(voteReplyPayload);
        } else {
          setVoteState({ ...voteState, databaseVote: voteState.userVote });
        }
      }
    }
  }, 5000, [ voteDebounce ]);

  // Functions:
  const handleVote = async (newVote) => {
    if (!isVoteDebounceReady()) {
      cancelVoteDebounce();
    } if (!postingVote) {
      let newVoteState = {
        ...voteState,
        oldUserVote: voteState.userVote,
        oldUpVotes: voteState.upVotes,
        oldDownVotes: voteState.downVotes
      };
      if (voteState.userVote === NOVOTE) {
        if (newVote === UPVOTE) {
          newVoteState = { ...newVoteState, upVotes: voteState.upVotes + 1 };
        } else if (newVote === DOWNVOTE) {
          newVoteState = { ...newVoteState, downVotes: voteState.downVotes + 1 };
        }
        newVoteState = { ...newVoteState, userVote: newVote };
      } else {
        if (newVote === voteState.userVote) {
          if (newVote === UPVOTE) {
            newVoteState = { ...newVoteState, upVotes: voteState.upVotes - 1 };
          } else if (newVote === DOWNVOTE) {
            newVoteState = { ...newVoteState, downVotes: voteState.downVotes - 1 };
          }
          newVoteState = { ...newVoteState, userVote: NOVOTE };
        } else {
          if (newVote === UPVOTE) {
            newVoteState = { ...newVoteState, upVotes: voteState.upVotes + 1, downVotes: voteState.downVotes - 1 };
          } else if (newVote === DOWNVOTE) {
            newVoteState = { ...newVoteState, upVotes: voteState.upVotes - 1, downVotes: voteState.downVotes + 1 };
          }
          newVoteState = { ...newVoteState, userVote: newVote };
        }
      }
      setVoteState(newVoteState);
      props.handleChildVoteReply(newVoteState.upVotes, newVoteState.downVotes, newVoteState.userVote, props.reply.ID);
      triggerVoteDebounce(voteDebounce === null ? true : !voteDebounce);
    }
  };

  const handleDelete = async () => {
    props.handleChildDeleteReply(props.reply.ID);
    const { result: deleteReplyResult, payload: deleteReplyPayload } = await deleteReply(props.reply.ID, props.commentID, kirak32(sanitizeURL(window.location.href)));
    if (deleteReplyResult === RESULTS.FAILURE) {
      console.error(deleteReplyPayload);
    }
  };

  const handleFlag = async () => {
    if (!isReplyFlagged) {
      setReplyFlag(true);
      const { result: flagReplyResult, payload: flagReplyPayload } = await flagReply(props.reply.ID, props.commentID, kirak32(sanitizeURL(window.location.href)));
      if (flagReplyResult === RESULTS.FAILURE) {
        setReplyFlag(false);
        console.error(flagReplyPayload);
      }
    }
  };

  const handlePostReply = async () => {
    if (canReply && !isPostingReply) {
      if (reply.length > 0) {
        setCanReply(false);
        setIsPostingReply(true);
      } else {
        return;
      }
      const { result: postReplyResult, payload: postReplyPayload } = await props.handleChildPostReply(reply);
      if (postReplyResult === RESULTS.SUCCESS) {
        resetReply();
        setErrorText('');
      } else {
        console.error(postReplyPayload);
        if (postReplyPayload.payload.code === 'above-quota') {
          setErrorText(postReplyPayload.payload.message);
        }
      }
      setCanReply(true);
      setIsPostingReply(false);
      toggleReplyBoxVisibility(false);
    }
  };

  // Return:
  return (
    <Wrapper>
      <ProfilePictureArea>
        <a
          title={ `Check out ${ props.reply.author }'s profile.` }
          href={ `https://openreply.app/${ props.reply.author }` }
          rel="noopener noreferrer"
          target='_blank'
        >
          <ProfilePicture imageSrc={ profilePicture } />
        </a>
      </ProfilePictureArea>
      <ReplyArea>
        <ReplyMain>
          <ReplyDetails>
            <ReplyAuthor
              title={ `Check out ${ props.reply.author }'s profile.` }
              href={ `https://openreply.app/${ props.reply.author }` }
              rel="noopener noreferrer"
              target='_blank'
            >{ props.reply.author }</ReplyAuthor>
            <ReplyTime>{ prettyMilliseconds(Date.now() - props.reply.createdOn, { compact: true }) }</ReplyTime>
            <ReplyDecorators>
              {
                props.reply.flagged
                &&
                databaseUser.babyMode
                &&
                <ReplyDecorator style={{ backgroundColor: COLORS.ULTRA_RED, color: COLORS.WHITE }} >FLAGGED</ReplyDecorator>
              }
              {
                props.reply.decorators.map((decorator) => (
                  <ReplyDecorator style={{ backgroundColor: decorator.backgroundColor, color: decorator.color }} >{ truncate(decorator.text, 20) }</ReplyDecorator>
                ))
              }
            </ReplyDecorators>
          </ReplyDetails>
          <ReplyBody
            theme={ theme }
            flagged={ databaseUser.babyMode ? props.reply.flagged : false }
          >
            {
              replyBody
            }
          </ReplyBody>
          {
            showReadAction
            ?
            (
              showFullReply
              ?
              <ReadAction onClick={ () => setShowFullReply(false) }>Show less</ReadAction>
              :
              <ReadAction onClick={ () => setShowFullReply(true) }>Read more</ReadAction>
            )
            :
            <></>
          }
        </ReplyMain>
        <ReplyOptions>
          <VoteWrapper>
            <UpvoteIcon
              src={ ARROW }
              canVote={ isAuth }
              isSelected={ voteState.userVote === UPVOTE ? true : false }
              onClick={ () => handleVote(UPVOTE) }
            />
            <UpvoteNumber
              isSelected={ voteState.userVote === UPVOTE ? true : false }
            >
              { voteState.upVotes }
            </UpvoteNumber>
            <DownvoteIcon
              src={ ARROW }
              canVote={ isAuth }
              isSelected={ voteState.userVote === DOWNVOTE ? true : false }
              onClick={ () => handleVote(DOWNVOTE) }
            />
            <DownvoteNumber
              isSelected={ voteState.userVote === DOWNVOTE ? true : false }
            >
              { voteState.downVotes }
            </DownvoteNumber>
          </VoteWrapper>
          <ReplyText
            replyBoxVisibility={ replyBoxVisibility }
            isAuth={ isAuth }
            onClick={
              () => {
                if (isAuth) {
                  toggleReplyBoxVisibility(!replyBoxVisibility);
                } else {
                  history.push(ROUTES.LOGIN);
                }
              }
            }
          >
            { replyBoxVisibility ? 'Cancel' : 'Reply' }
          </ReplyText>
          {
            isAuth
            &&
            (
              props.reply.author === authUser.username
              ?
              <DeleteIcon
                src={ DELETE }
                onClick={ handleDelete }
              />
              :
              <FlagIcon
                src={ FLAG }
                isReplyFlagged={ isReplyFlagged }
                onClick={ handleFlag }
              />
            )
          }
        </ReplyOptions>
        {
          replyBoxVisibility
          &&
          <>
            <WriteAReply>
              <ProfilePicture imageSrc={ profilePicture } />
              <ReplyBox
                ref={ replyBoxRef }
                maxRows={ 5 }
                minRows={ 1 }
                placeholder="Add a reply..."
                { ...bindReply }
                theme={ theme }
                readOnly={ isPostingReply }
              />
            </WriteAReply>
            <PostReplyWrapper>
              <PostReplyButton
                tabIndex={ 0 }
                theme={ theme }
                canReply={ canReply }
                onClick={ handlePostReply }
              >
                {
                  isPostingReply
                  ?
                  <ButtonLoadingWrapper>
                    <ButtonLoadingGIF src={ LOADING } />
                  </ButtonLoadingWrapper>
                  :
                  'Post'
                }
              </PostReplyButton>
              <ErrorText>{ errorText }</ErrorText>
            </PostReplyWrapper>
          </>
        }
      </ReplyArea>
    </Wrapper>
  );
};


// Exports:
export default Reply;
