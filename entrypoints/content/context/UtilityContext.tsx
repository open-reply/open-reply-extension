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
  currentURL?: string
}

export const UtilityContext = createContext<UtilityContextType>({
  shouldHide: false,
  isLoaded: false,
  setIsLoaded: () => { },
  isActive: false,
  setIsActive: () => { },
  currentURL: undefined
})

// Exports:
export const UtilityContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const DARK_URLS = ['accounts.google.com/v3/signin/identifier']
  
  // State:
  const [shouldHide, setShouldHide] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [currentURL, setCurrentURL] = useState<string>()

  // Effects:
  useInterval(() => {
    const _URL = window.location.host + window.location.pathname + window.location.search
    if (currentURL !== _URL) {
      const cleanURL = window.location.host + window.location.pathname
      setShouldHide(DARK_URLS.includes(cleanURL))
      setCurrentURL(_URL)
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
        currentURL,
      }}
    >
      {children}
    </UtilityContext.Provider>
  )
}
