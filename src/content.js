/* global chrome */
/* src/content.js */


// Packages:
import React from 'react';
import ReactDOM from 'react-dom';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import { StyleSheetManager } from 'styled-components';
import { Provider } from 'react-redux';


// Imports:
import store from './redux/store';


// Components:
import App from './App';


// Variables:
let displayStatus = false;


// Functions:
const Main = () => {
  return (
    <Frame head={
      [
        <link type='text/css' rel='stylesheet' href={ chrome.runtime.getURL('/css/content.css') } ></link>,
        <link href='https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap' rel='stylesheet'></link>,
        // <link href='https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@600&display=swap' rel='stylesheet'></link>
      ]
    }>
      <FrameContextConsumer>
        {
          ({ document, window }) => (
            <StyleSheetManager target={ document.head }>
              <Provider store={ store }>
                <App
                  document={ document }
                  window={ window }
                  isExt={ true }
                />
              </Provider>
            </StyleSheetManager>
          )
        }
      </FrameContextConsumer>
    </Frame>
  );
};


// Elements:
const BubbleCTA = document.createElement('div');
BubbleCTA.id = 'open-reply-bubblecta';
BubbleCTA.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'C2B_TOGGLE_VISIBILITY', payload: true });
});

const CloseBubble = document.createElement('div');
CloseBubble.id = 'open-reply-closebubble';
CloseBubble.addEventListener('click', () => {
  BubbleCTA.remove();
  CloseBubble.remove();
});

const Wrapper = document.createElement('div');
Wrapper.id = 'open-reply-wrapper';
Wrapper.style.cssText = `
	font-family: 'Inter', sans-serif;
`;

const Dimmer = document.createElement('div');
Dimmer.id = 'open-reply-dimmer';
Dimmer.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'C2B_TOGGLE_VISIBILITY', payload: false });
});


document.body.appendChild(Wrapper);
document.body.appendChild(Dimmer);
ReactDOM.render(<Main />, Wrapper);


// Listeners:
chrome.storage.sync.get(['bubbleVisibility'], (result) => {
  if (result) {
    if (result.bubbleVisibility !== false) {
      document.body.appendChild(BubbleCTA);
      document.body.appendChild(CloseBubble);
    }
  } else {
    document.body.appendChild(BubbleCTA);
    document.body.appendChild(CloseBubble);
  }
});

chrome.runtime.onMessage.addListener((message) => {
	if (message.type === 'B2C_TOGGLE_VISIBILITY') {
		displayStatus = message.payload === null ? !displayStatus : message.payload;
  }
  if (displayStatus) {
    document.body.style.overflow = 'hidden';
    Wrapper.classList.add('show-open-reply-wrapper');
    Dimmer.classList.add('show-open-reply-dimmer');
  } else {
    document.body.style.overflow = 'initial';
    Wrapper.classList.remove('show-open-reply-wrapper');
    Dimmer.classList.remove('show-open-reply-dimmer');
  }
});
