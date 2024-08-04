// Packages:
import React, { createContext, useState } from 'react'

// Typescript:
export interface UtilityContextType {
  isLoaded: boolean
  setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>
  isActive: boolean
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>
}

export const UtilityContext = createContext<UtilityContextType>({
  isLoaded: false,
  setIsLoaded: () => { },
  isActive: false,
  setIsActive: () => { },
})

// Exports:
export const UtilityContextProvider = ({ children }: { children: React.ReactNode }) => {
  // State:
  const [isLoaded, setIsLoaded] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Return:
  return (
    <UtilityContext.Provider
      value={{
        isLoaded,
        setIsLoaded,
        isActive,
        setIsActive,
      }}
    >
      {children}
    </UtilityContext.Provider>
  )
}
