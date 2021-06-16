// Packages:
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Scrollbars } from 'react-custom-scrollbars';
import sanitizeURL from '../../../../util/url-sanitize';
import kirak32 from '../../../../util/kirak32';
import TextareaAutosize from 'react-textarea-autosize';
import { useSelector } from 'react-redux';
import { useInput } from '../../../../hooks/use-input';
import { useHistory } from 'react-router-dom';
import useDatabase from '../../../../hooks/database';
import humanFormat from 'human-format';


// Imports:
import { LOADING, LEFT_CHEVRON, ACCOUNT } from '../../../../assets/icons';


// Constants:
import COLORS from '../../../../styles/colors';
import THEMES from '../../../../styles/themes';
import ROUTES from '../../../../routes';
import { RESULTS } from '../../../../constants';


// Components:
import Comment from '../Comment';


// Styles:
const Wrapper = styled.div`
  position: fixed;
  top: 23vh;
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 77vh;
`;

const CommentsHead = styled.div`
  width: 100%;
  margin-bottom: ${ props => props.isAuth ? 'initial' : '1em' };
`;

const Title = styled.div`
  // margin-left: 2em;
  margin: 1em 0em 1em 2em;
  color: ${ COLORS.SONIC_SILVER };
  font-weight: 600;
  font-size: 1em;
`;

const WriteAComment = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  height: 5em;
  margin: 1em 2em 0em 2em;
`;

const ProfilePicture = styled.div`
  width: 3em;
  height: 3em;
  background-image: ${ props => 'url("' + props.imageSrc + '")' };
  background-size: cover;
  background-position: center;
  border-radius: 50%;
`;

const CommentBox = styled(TextareaAutosize)`
  width: 85%;
  margin-left: 1em;
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

const PostCommentWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  padding: 0em 3.5em;
`;

const PostCommentButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 4em;
  height: 1em;
  padding: 0.8em 1.8em;
  background: ${ props => props.canComment ? COLORS.PRIMARY : props.theme === THEMES.DARK ? COLORS.GUNMETAL : COLORS.COLD_GREY };
  color: ${ props => props.theme === THEMES.DARK ? COLORS.BLACK : COLORS.WHITE };
  font-weight: 700;
  font-size: 1em;
  border-radius: 0.3em;
  user-select: none;
  cursor: ${ props => props.canComment ? 'pointer' : 'default' };
  transition: all 0.25s ease;

  &:focus {
    outline: 0;
  }
`;

const ErrorText = styled.div`
  margin: 0 0.5rem;
  color: ${ COLORS.ULTRA_RED };
  font-weight: 600;
  font-size: 1em;
`;

const RegisterNotification = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 5em;
  font-weight: 600;
  font-size: 1em;
`;

const RegisterButton = styled.div`
  padding: 1em 3em;
  color: ${ props => props.theme === THEMES.DARK ? COLORS.BLACK : COLORS.WHITE };
  background-color: ${ COLORS.PRIMARY };
  border-radius: 2em;
  user-select: none;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background-color: ${ COLORS.LIGHT_PRIMARY };
    transition: all 0.25s ease;
  }
`;

const CommentsBody = styled.div`
  width: 100%;
  height: 75%;
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

const NoComments = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 3em;
  font-weight: 600;
  font-size: 1em;
`;


// Functions:
const Comments = (props) => {
  // Constants:
  const { postComment, loadComments, deleteComment } = useDatabase();
  const history = useHistory();
  
  // State:
  const { theme, auth } = useSelector(state => state);
  const extensionVisibility = useSelector(state => state.extension.visibility);
  const { value: comment, bind: bindComment, reset: resetComment } = useInput('');
  const [ canComment, setCanComment ] = useState(false);
  const [ isPostingComment, setIsPostingComment ] = useState(false);
  const [ commentsArray, setCommentsArray ] = useState([]);
  const [ commentsLoaded, setCommentsLoaded ] = useState(false);
  const [ showMoreComments, setShowMoreComments ] = useState(false);
  const [ errorText, setErrorText ] = useState('');

  // Effects:
  useEffect(() => {
    if (props.URLExistsInDatabase !== null && auth.loaded) {
      if (extensionVisibility && !commentsLoaded && props.URLExistsInDatabase) {
        (async () => {
          const { result: loadCommentsResult, payload: loadCommentsPayload } = await loadComments(kirak32(sanitizeURL(window.location.href)));
          if (loadCommentsResult === RESULTS.SUCCESS) {
            setCommentsArray(loadCommentsPayload);
            setCommentsLoaded(true);
            if (loadCommentsPayload.length !== props.URLDetails.totalComments) {
              setShowMoreComments(true);
            }
          } else {
            console.error(loadCommentsPayload);
          }
        })();
      } else {
        setCommentsLoaded(true);
      }
    }
  }, [ extensionVisibility, auth.loaded, props.URLExistsInDatabase ]);

  useEffect(() => {
    if (comment.length > 0) {
      setCanComment(true);
    } else {
      setCanComment(false);
    }
  }, [ comment ]);

  // Functions:
  const handlePost = async () => {
    if (canComment && !isPostingComment) {
      if (comment.length > 0) {
        setCanComment(false);
        setIsPostingComment(true);
      } else {
        return;
      }
      const { result: postCommentResult, payload: postCommentPayload } = await postComment(comment, kirak32(sanitizeURL(window.location.href)));
      if (postCommentResult === RESULTS.SUCCESS) {
        const newCommentsArray = commentsArray;
        newCommentsArray.unshift(postCommentPayload);
        setCommentsArray(newCommentsArray);
        props.updateURLDetails({
          ...props.URLDetails,
          totalComments: props.URLDetails.totalComments + 1
        });
        resetComment();
        setErrorText('');
      } else {
        console.error(postCommentPayload);
        if (postCommentPayload.payload.code === 'above-quota') {
          setErrorText(postCommentPayload.payload.message);
        }
      }
      setCanComment(true);
      setIsPostingComment(false);
    }
  };

  const handleDelete = async (commentID) => {
    setCommentsArray(commentsArray.filter(comment => comment.ID !== commentID));
    props.updateURLDetails({
      ...props.URLDetails,
      totalComments: props.URLDetails.totalComments - 1
    });
    const { result: deleteCommentResult, payload: deleteCommentPayload } = await deleteComment(commentID, kirak32(sanitizeURL(window.location.href)));
    if (deleteCommentResult === RESULTS.FAILURE) {
      console.error(deleteCommentPayload);
    }
  };

  const loadMoreComments = async () => {
    setShowMoreComments(false);
    const { result: loadCommentsResult, payload: loadCommentsPayload } = await loadComments(kirak32(sanitizeURL(window.location.href)));
    if (loadCommentsResult === RESULTS.SUCCESS) {
      setCommentsArray(commentsArray.concat(loadCommentsPayload));
      setShowMoreComments(true);
    } else {
      setShowMoreComments(true);
      console.error(loadCommentsPayload);
    }
  };

  // Return:
  return (
    <Wrapper>
      <CommentsHead
        isAuth={ auth.isAuth }
      >
        <Title>{ humanFormat(props.URLDetails.totalComments, { separator: '' }) } Comments</Title>
        {
          auth.isAuth
          ?
          <>
            <WriteAComment>
              <ProfilePicture imageSrc={ auth.user.photoURL === null ? ACCOUNT : auth.user.photoURL } />
              <CommentBox
                maxRows={ 5 }
                minRows={ 1 }
                placeholder="Add a comment..."
                { ...bindComment }
                theme={ theme }
                readOnly={ isPostingComment }
              />
            </WriteAComment>
            <PostCommentWrapper>
              <PostCommentButton
                tabIndex={ 0 }
                theme={ theme }
                canComment={ canComment }
                onClick={ handlePost }
              >
                {
                  isPostingComment
                  ?
                  <ButtonLoadingWrapper>
                    <ButtonLoadingGIF src={ LOADING } />
                  </ButtonLoadingWrapper>
                  :
                  'Comment'
                }
              </PostCommentButton>
              <ErrorText>{ errorText }</ErrorText>
            </PostCommentWrapper>
          </>
          :
          <RegisterNotification>
            <RegisterButton theme={ theme } onClick={ () => history.push(ROUTES.REGISTER) }>
              Register to add a comment
            </RegisterButton>
          </RegisterNotification>
        }
      </CommentsHead>
      <CommentsBody>
        <Scrollbars style={{ width: '100%', height: '100%' }}>
          {
            (props.URLDetails.totalComments > 0 && commentsArray.length > 0) ?
            <>
              {
                commentsArray.map((comment) => (
                  <Comment
                    key={ comment.ID }
                    comment={{
                      ID: comment.ID,
                      author: comment.author,
                      authorUID: comment.authorUID,
                      createdOn: comment.createdOn,
                      body: comment.body,
                      totalReplies: comment.totalReplies,
                      userVote: comment.userVote,
                      upVotes: comment.upVotes,
                      downVotes: comment.downVotes,
                      flagged: comment.flagged,
                      decorators: []
                    }}
                    handleDelete={ handleDelete }
                  />
                ))
              }
              {
                commentsArray.length !== props.URLDetails.totalComments
                &&
                (
                  showMoreComments
                  ?
                  <ShowMore onClick={ loadMoreComments }>
                    <ArrowIcon src={ LEFT_CHEVRON } />
                    Show More
                  </ShowMore>
                  :
                  <LoadingWrapper>
                    <LoadingGIF src={ LOADING } />
                  </LoadingWrapper>
                )
              }
            </>
            :
            (
              !commentsLoaded
              ?
              <LoadingWrapper>
                <LoadingGIF src={ LOADING } />
              </LoadingWrapper>
              :
              <NoComments>No comments yet. Be the first to comment!</NoComments>
            )
          }
        </Scrollbars>
      </CommentsBody>
    </Wrapper>
  );
};


// Exports:
export default Comments;
