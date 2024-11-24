// Packages:
import React, { createContext, useState } from 'react'
import { useInterval } from 'react-use'
import getURLHash from 'utils/getURLHash'
import returnable from 'utils/returnable'
import logError from 'utils/logError'

// Typescript:
import type { Returnable } from 'types'

export interface UtilityContextType {
  shouldHide: boolean
  isLoaded: boolean
  setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>
  isActive: boolean
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>
  currentDomain?: string
  currentURL?: string
  currentURLHash?: string
  title?: string
  description?: string
  keywordsString?: string
  keywords: string[]
  image?: string
  /**
   * WARNING
   * 
   * This favicon may change frequently, as certain websites change it quite often based on their internal state.
   * 
   * For a static favicon, please rely on `getStaticWebsiteFavicon`.
   */
  favicon?: string
  takeFaviconScreenshot: () => Promise<Returnable<string, Error>>
}

// Context:
export const UtilityContext = createContext<UtilityContextType>({
  shouldHide: false,
  isLoaded: false,
  setIsLoaded: () => { },
  isActive: false,
  setIsActive: () => { },
  currentDomain: undefined,
  currentURL: undefined,
  currentURLHash: undefined,
  title: undefined,
  description: undefined,
  keywordsString: undefined,
  keywords: [],
  image: undefined,
  favicon: undefined,
  takeFaviconScreenshot: async () => returnable.fail(new Error('UtilityContext is not yet initialized!'))
})

// Constants:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'

// Exports:
export const UtilityContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const DARK_URLS = ['accounts.google.com/v3/signin/identifier']
  
  // State:
  const [shouldHide, setShouldHide] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [currentDomain, setCurrentDomain] = useState<string>()
  const [currentURL, setCurrentURL] = useState<string>()
  const [currentURLHash, setCurrentURLHash] = useState<string>()
  const [title, setTitle] = useState<string>()
  const [description, setDescription] = useState<string>()
  const [keywordsString, setKeywordsString] = useState<string>()
  const [keywords, setKeywords] = useState<string[]>([])
  const [image, setImage] = useState<string>()
  const [favicon, setFavicon] = useState<string>()

  // Functions:
  const takeFaviconScreenshot = async (): Promise<Returnable<string, Error>> => {
    try {
      const _favicon = await new Promise<string>((resolve, reject) => {
        chrome.runtime.sendMessage({ type: INTERNAL_MESSAGE_ACTIONS.GENERAL.GET_FAVICON }, (response: Returnable<string, string>) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (response && response.status) {
            resolve(response.payload)
          } else {
            reject(new Error(response.payload))
          }
        })
      })

      setFavicon(_favicon)
      return returnable.success(_favicon)
    } catch (error) {
      logError({
        functionName: 'takeFaviconScreenshot',
        data: null,
        error,
      })

      return returnable.fail(error as unknown as Error)
    }
  }

  // Effects:
  useInterval(() => {
    const _URL = window.location.host + window.location.pathname + window.location.search
    if (currentURL !== _URL) {
      const cleanURL = window.location.host + window.location.pathname
      setShouldHide(DARK_URLS.includes(cleanURL))
      setCurrentDomain(window.location.host)
      setCurrentURL(_URL)
      getURLHash(_URL).then(setCurrentURLHash)
    }

    const _title = document.title ??
      (document.querySelector('meta[name="title"]') as HTMLMetaElement)?.content ??
      (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content ??
      (document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement)?.content
    if (_title !== title) setTitle(_title)

    const _description = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content ??
      (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content ??
      (document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement)?.content
    if (_description !== description) setDescription(_description)
  
    const _keywordsString = (document.querySelector('meta[name="keywords"]') as HTMLMetaElement)?.content ?? ''
    const _keywords = _keywordsString.split(', ')

    if (_keywordsString !== keywordsString) {
      setKeywordsString(_keywordsString)
      setKeywords(_keywords)
    }

    const _image = (document.querySelector('meta[property="og:image"]') as HTMLMetaElement)?.content ??
      (document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement)?.content
    if (_image !== image) setImage(image)
  }, 500)

  useEffect(() => {
    chrome.runtime.onMessage.addListener(request => {
      if (request.type === INTERNAL_MESSAGE_ACTIONS.GENERAL.TOGGLE) setIsActive(_isActive => !_isActive)
    })
  }, [])

  // useEffect(() => {
  //   takeFaviconScreenshot()
  // }, [])

  // Return:
  return (
    <UtilityContext.Provider
      value={{
        shouldHide,
        isLoaded,
        setIsLoaded,
        isActive,
        setIsActive,
        currentDomain,
        currentURL,
        currentURLHash,
        title,
        description,
        keywordsString,
        keywords,
        image,
        favicon,
        takeFaviconScreenshot,
      }}
    >
      {children}
    </UtilityContext.Provider>
  )
}
