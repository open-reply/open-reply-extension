// Packages:
import { INTERNAL_MESSAGE_ACTIONS } from 'constants/internal-messaging'
import React, { createContext, useState } from 'react'
import { useInterval } from 'react-use'

// Typescript:
export interface UtilityContextType {
  shouldHide: boolean
  isLoaded: boolean
  setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>
  isActive: boolean
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>
  currentDomain?: string
  currentURL?: string
  title?: string
  description?: string
  keywordsString?: string
  keywords: string[]
}

export const UtilityContext = createContext<UtilityContextType>({
  shouldHide: false,
  isLoaded: false,
  setIsLoaded: () => { },
  isActive: false,
  setIsActive: () => { },
  currentDomain: undefined,
  currentURL: undefined,
  title: undefined,
  description: undefined,
  keywordsString: undefined,
  keywords: [],
})

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
  const [title, setTitle] = useState<string>()
  const [description, setDescription] = useState<string>()
  const [keywordsString, setKeywordsString] = useState<string>()
  const [keywords, setKeywords] = useState<string[]>([])

  // Effects:
  useInterval(() => {
    const _URL = window.location.host + window.location.pathname + window.location.search
    if (currentURL !== _URL) {
      const cleanURL = window.location.host + window.location.pathname
      setShouldHide(DARK_URLS.includes(cleanURL))
      setCurrentDomain(window.location.host)
      setCurrentURL(_URL)
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
  }, 500)

  useEffect(() => {
    chrome.runtime.onMessage.addListener(request => {
      if (request.type === INTERNAL_MESSAGE_ACTIONS.GENERAL.TOGGLE) setIsActive(_isActive => !_isActive)
    })
  }, [])

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
        title,
        description,
        keywordsString,
        keywords,
      }}
    >
      {children}
    </UtilityContext.Provider>
  )
}
