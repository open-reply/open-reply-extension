// Packages:
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useDatabase from '../../hooks/database';
import sanitizeURL from '../../util/url-sanitize';
import kirak32 from '../../util/kirak32';
import { useSelector } from 'react-redux';


// Constants:
import { VIEW_LIFECYCLE } from '../../constants/view';
import { NOVOTE } from '../../constants/voting';


// Components:
import Head from '../../components/views/Home/Head';
import Comments from '../../components/views/Home/Comments';
import { RESULTS } from '../../constants';


// Styles:
const Wrapper = styled.div`
  position: absolute;
  top: 0vh;
  width: 100vw;
  height: 100vh;
  opacity: ${ props => props.viewLifeCycle === VIEW_LIFECYCLE.MOUNTED ? 1 : 0 };
  transform: ${ props => props.viewLifeCycle === VIEW_LIFECYCLE.MOUNTED ? 'translateY(0)' : 'translateY(5em)' };
  transition: all 0.5s ease;
`;


// Functions:
const Home = () => {
  // State:
  const extensionVisibility = useSelector(state => state.extension.visibility);
  const auth = useSelector(state => state.auth);
  const { loadURLDetails } = useDatabase();
  const [ viewLifeCycle, setViewLifeCycle ] = useState(VIEW_LIFECYCLE.MOUNTING);
  const [ URLDetails, setURLDetails ] = useState({
    userVote: NOVOTE,
    createdBy: null,
    createdOn: null,
    totalComments: 0,
    upVotes: 0,
    downVotes: 0,
    totalVote: 0,
    flagged: false,
    flagCount: 0
  });
  const [ URLDetailsLoaded, setURLDetailsLoaded ] = useState(false);
  const [ URLExistsInDatabase, setURLExistsInDatabase ] = useState(null);

  // Effects:
  useEffect(() => {
    if (extensionVisibility) {
      setViewLifeCycle(VIEW_LIFECYCLE.MOUNTED);
    } else {
      setViewLifeCycle(VIEW_LIFECYCLE.UNMOUNTING);
    }
    if (extensionVisibility && !URLDetailsLoaded && auth.loaded) {
      (async () => {
        const { result: loadURLDetailsResult, payload: loadURLDetailsPayload } = await loadURLDetails(kirak32(sanitizeURL(window.location.href)));
        if (loadURLDetailsResult === RESULTS.SUCCESS) {
          if (loadURLDetailsPayload !== null) {
            setURLDetails(loadURLDetailsPayload);
            setURLExistsInDatabase(true);
          } else {
            setURLExistsInDatabase(false);
          }
        } else {
          console.error(loadURLDetailsPayload);
        }
        setURLDetailsLoaded(true);
      })();
    }
  }, [ extensionVisibility, URLDetailsLoaded, auth.loaded, loadURLDetails ]);

  // Functions:
  const updateURLDetails = (newURLDetails) => {
    setURLDetails(newURLDetails);
  };
  
  // Return:
  return (
    <Wrapper viewLifeCycle={ viewLifeCycle }>
      <Head URLDetails={ URLDetails } URLDetailsLoaded={ URLDetailsLoaded } updateURLDetails={ updateURLDetails } />
      <Comments URLDetails={ URLDetails } URLExistsInDatabase={ URLExistsInDatabase } updateURLDetails={ updateURLDetails } />
    </Wrapper>
  );
};


// Exports:
export default Home;
