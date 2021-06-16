// Packages:
import truncate from 'truncate';


// Functions:
const superTrunc = (string, limitObj) => {
  const { charLimit, newLineLimit } = limitObj;
  let finalString = '', newLineCounter = 0;
  for (let i = 0; i < string.length; i++) {
    if (newLineCounter === newLineLimit) {
      break;
    } else {
      finalString = finalString + string[i];
    }
    if (string[i] === '\n') {
      newLineCounter++;
    }
  }
  return truncate(finalString, charLimit);
};


// Exports:
export default superTrunc;

export const newLineCounter = (string) => {
  let newLineCounter = 0;;
  for (let i = 0; i < string.length; i++) {
    if (string[i] === '\n') {
      newLineCounter++;
    }
  }
  return newLineCounter;
};
