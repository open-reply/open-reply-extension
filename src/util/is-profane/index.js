// Imports:
import badWordsList from './badWordsList';


// Functions:
/**
 * Determine if a string contains profane language.
 * From: https://www.npmjs.com/package/bad-words
 * @param { string } string - String to evaluate for profanity.
 */
const isProfane = (string) => {
  return badWordsList
    .words
    .filter((word) => {
      const wordExp = new RegExp(`\\b${word.replace(/(\W)/g, '\\$1')}\\b`, 'gi');
      return wordExp.test(string);
    }).length > 0 || false;
};


// Exports:
export default isProfane;
