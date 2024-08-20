// Packages:
import React, { createContext, useState } from 'react'
import { useInterval } from 'react-use'

// Typescript:
export interface UtilityContextType {
  isLoaded: boolean
  setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>
  isActive: boolean
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>
  currentURL?: string
}

export const UtilityContext = createContext<UtilityContextType>({
  isLoaded: false,
  setIsLoaded: () => { },
  isActive: false,
  setIsActive: () => { },
  currentURL: undefined
})

// Exports:
export const UtilityContextProvider = ({ children }: { children: React.ReactNode }) => {
  // State:
  const [isLoaded, setIsLoaded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [currentURL, setCurrentURL] = useState<string>()

  // Effects:
  useInterval(() => {
    const URL = window.location.host + window.location.pathname + window.location.search
    if (currentURL !== URL) setCurrentURL(URL)
  }, 500)

  // Return:
  return (
    <UtilityContext.Provider
      value={{
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
