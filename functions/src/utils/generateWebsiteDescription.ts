// Packages:
import OpenAI from 'openai'
import logError from 'utils/logError'
import returnable from 'utils/returnable'

// Typescript:
import type { Returnable } from 'types/index'
import type { RealtimeDatabaseWebsiteSEO } from 'types/realtime.database'

// Constants:
import OPENAI from '../constants/openai'

// Functions:
const generateWebsiteDescription = async ({
  URL,
  title,
  keywords,
}: {
  URL: RealtimeDatabaseWebsiteSEO['URL']
  title: RealtimeDatabaseWebsiteSEO['title'],
  keywords: RealtimeDatabaseWebsiteSEO['keywords']
}): Promise<Returnable<{
  successfulGeneration: boolean
  description: string
  isNSFW: boolean
}, Error>> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    })

    const prompt = `${OPENAI.INSTRUCTIONS.JSON}Please generate a 30 word description of a website given the following. The website may be NSFW:
- URL: "${URL}"
${ title && `- Website Title: "${title}"` }
${ keywords && `- Website Keywords: "${keywords.join(', ')}"` }

Provide a JSON object with the following fields:
1. description: A 30 word description of the website.
2. isNSFW: A boolean representing if the website is not-safe-for-work (NSFW) or not.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })

    const result = {
      successfulGeneration: true,
      description: '',
      isNSFW: false,
    }

    try {
      const parseResult = JSON.parse(response.choices[0].message.content ?? '{}') as { description: string, isNSFW: boolean }
  
      if (parseResult.description) result.description = parseResult.description
      if (parseResult.isNSFW) result.isNSFW = parseResult.isNSFW
    } catch (error) {
      result.successfulGeneration = false
      logError({
        data: {
          response,
          content: response.choices[0].message.content,
        },
        error,
        functionName: 'generateWebsiteDescription.OpenAI',
      })
    }

    return returnable.success(result)
  } catch (error) {
    logError({
      data: {
        URL,
        title,
        keywords,
      },
      error,
      functionName: 'generateWebsiteDescription',
    })

    return returnable.fail(error as unknown as Error)
  }
}

// Exports:
export default generateWebsiteDescription
