"use client"

import React, { createContext, useContext, useState } from "react"

type CharacterContextType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  character: any | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCharacter: (character: any) => void
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined)
export const CharacterProvider = ({ children, initialCharacter }: {
  children: React.ReactNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialCharacter: any
}) => {
  const [character, setCharacter] = useState(initialCharacter)


  return (
    <CharacterContext value={{ character, setCharacter }}>
      {children}
    </CharacterContext>
  )
}

export const useCharacter = () => {
  const context = useContext(CharacterContext)

  if (!context) {
    throw new Error("useCharacter must be used within a CharacterProvider")
  }

  return context
}