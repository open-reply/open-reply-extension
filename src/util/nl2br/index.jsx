// Packages:
import React from 'react';


// Functions:
const nl2br = (inputString) => {
  const outputJSX = inputString
    .split('\n')
    .map((item, ID) => (
      <span key={ ID }>
        { item }
        <br />
      </span>
    ));
  
  return outputJSX;
};


// Exports:
export default nl2br;