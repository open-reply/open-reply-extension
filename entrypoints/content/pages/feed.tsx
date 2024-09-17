// Typescript:
import { TOPICS } from 'constants/database/comments-and-replies'
import Comment from '../components/secondary/comment/Comment'
import { FieldValue } from 'firebase-admin/firestore'


// Constants:
const SAMPLE_USER_INFO = {
  fullName: 'Ben Holmes',
  username: '@BenHolmesDev'
}

const SAMPLE_CONTENT = `Right when I heard Stephen first talk I had a gut feeling that it was him. 
Just the way he talked about the situation it's like he had already come to terms with something as crazy and as random as an explosion. 
Bro had a eulogy ready for her and everything.`

const SAMPLE_COMMENT = {
  id: 'some uuid',
  URLHash: 'string',
  domain: 'sdsd',
  URL: 'https://www.example.co.uk:443/blog/article/search?docid=720&hl=en',
  author: 'dfsdfs',
  replyCount: 0,
  sentiment: 5, 
  topics: [TOPICS.ANTHROPOLOGY], 
  // COULDN'T UNDERSTAND WHAT FIELD VALUE IS SO KINDA CIRCUMVENTING THIS
  // SHOULD NOT TO BE A PROBLEM WHEN WE INTEGRATE FIRESTORE
  createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000) as unknown as FieldValue, 
  creationActivityID: '',
  body: SAMPLE_CONTENT,
  voteCount: {
    up: 40,
    down: 4,
    controversy: 5,
    wilsonScore: 5
  }
}

// Functions:
const Feed = () => {
  return (
    <main className='w-full pt-16 bg-white' style={{ height: 'calc(100% - 68px)' }}>
      <Comment user={SAMPLE_USER_INFO} 
        comment={SAMPLE_COMMENT} />
    </main>
  )
}

// Exports:
export default Feed
