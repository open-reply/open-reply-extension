// Packages:
import React from 'react'

// Functions:
const splitBioText = (text: string): string[] => {
  return text.split(/(@\w+)/g)
}

const TextPart = ({
  text,
  onMentionClick,
}: {
  text: string
  onMentionClick: (mention: string) => void
}) => {
  if (text.startsWith('@')) {
    return (
      <strong
        className='cursor-pointer select-none hover:underline'
        onClick={() => onMentionClick(text.slice(1))}
      >
        {text}
      </strong>
    )
  }

  return <>{text}</>
}

const HighlightMentions = ({
  text,
  onMentionClick,
}: {
  text: string
  onMentionClick: (mention: string) => void
}): React.ReactNode => {
  if (!text) return <></>
  const parts = splitBioText(text)

  return (
    <>
      {
        parts.map((part, index) => (
          <TextPart
            key={index}
            text={part}
            onMentionClick={onMentionClick}
          />
        ))
      }
    </>
  )
}

// Exports:
export default HighlightMentions
