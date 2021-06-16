// Packages:
import sum from 'hash-sum';

// Functions:
/**
  * @description Generate an Action object.
  * @param { [ 'READ', 'WRITE' ] } type The type of action.
  * @param { [ 'URL', 'TEXT', 'VOTE', 'OPTIONS' ] } target The target action.
  * @param { string } body The body of the target action.
  * @returns { { hash: string, type: [ 'VOTE', 'RESPONSE' ] } } An Action object.
  * @example 
  * import useDatabase from './hooks/database';
  * const { postComment } = useDatabase();
  * const { result, payload } = await postComment('This is a comment', kirak32('4chan.org/pol/'));
  */
const generateAction = (type, target, body) => {
  return {
    type,
    target,
    hash: sum(body)
  };
};


// Exports:
export default generateAction;
