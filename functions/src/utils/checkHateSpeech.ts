// Packages:
import OpenAI from 'openai'
import logError from 'utils/logError'
import returnable from 'utils/returnable'

// Typescript:
import type { Returnable } from 'types/index'
import type { ContentHateSpeechResultWithSuggestion } from 'types/comments-and-replies'

// Constants:
import OPENAI from '../constants/openai'

// Functions:
const checkHateSpeech = async (content: string, noSuggestion = false): Promise<Returnable<ContentHateSpeechResultWithSuggestion, Error>> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    })

    let prompt = `${OPENAI.INSTRUCTIONS.JSON}`

    if (noSuggestion) {
      prompt = `You need to analyze the following user-submitted content for hate speech: "${content}"

Provide a JSON object with the following fields:
1. isHateSpeech: A boolean representing whether the content contains hate speech.
2. reason: A brief explanation behind the result of the analysis i.e. why isHateSpeech is false or true.`
    } else {
      prompt = `You need to analyze the following user-submitted content for hate speech: "${content}"

Provide a JSON object with the following fields:
1. isHateSpeech: A boolean representing whether the content contains hate speech.
2. reason: A brief explanation behind the result of the analysis i.e. why isHateSpeech is false or true.
3. suggestion: A very brief suggestion on how the content can be re-written to remove the hate speech.`
    }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  const result: ContentHateSpeechResultWithSuggestion = {
    isHateSpeech: false
  }

  try {
    const parseResult = JSON.parse(response.choices[0].message.content ?? '{}') as ContentHateSpeechResultWithSuggestion

    if (parseResult.reason && parseResult.suggestion) result.isHateSpeech = parseResult.isHateSpeech
    if (parseResult.isHateSpeech) result.reason = parseResult.reason
    if (parseResult.isHateSpeech) result.suggestion = parseResult.suggestion
  } catch (error) {
    logError({ data: response, error, functionName: 'checkHateSpeech.OpenAI' })
  }
  
  return returnable.success(result)
  } catch (error) {
    logError({ data: content, error, functionName: 'checkHateSpeech' })
    return returnable.fail(error as unknown as Error)
  }
}

// Exports:
export default checkHateSpeech
