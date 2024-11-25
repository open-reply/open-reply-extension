// Packages:
import React from 'react'

// Typescript:
import type { Topic } from 'types/comments-and-replies'

// Functions:
const TalksAboutTopics = ({
  topics,
} : {
  topics: Record<Topic, number>
}) => {
  // State:
  const [topTopics, setTopTopics] = useState<string[]>([])

  // Effects:
  useEffect(() => {
    setTopTopics(
      Object
        .entries(topics)
        .sort((topicA, topicB) => topicA[1] - topicB[1])
        .reverse()
        .splice(0, 3)
        .map(topicEntry => topicEntry[0].replace(/_/g, ' '))
        .map(topicCode => topicCode
          .split(' ')
          .map(topicCodeWord => topicCodeWord.charAt(0) + topicCodeWord.slice(1).toLocaleLowerCase())
          .join(' ')
        )
    )
  }, [topics])

  // Return:
  return (
    <>
      {
        topTopics.map(
          (topic, topicIndex) => (
            <React.Fragment key={`topic-${topicIndex}`}>
              {
                topic.split(' ').map(
                  (topicWord, topicWordIndex) => (
                    <span
                      key={`topic-${topicIndex}-${topicWordIndex}`}
                      className='font-semibold text-brand-primary'
                    >
                      { topicWord }
                      { ((topicWordIndex === topic.split(' ').length - 1) && (topicIndex !== topTopics.length - 1)) && ',' }
                    </span>
                  )
                )
              }
              { (topicIndex === topTopics.length - 2) && ' and' }
            </React.Fragment>
          )
        )
      }
    </>
  )
}


// Exports:
export default TalksAboutTopics
