// Packages:
import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';


// Components:
import App from './App';



// Functions:
ReactDOM.render(
  <App isExt={ false } />,
  document.getElementById('root')
);

registerServiceWorker();
