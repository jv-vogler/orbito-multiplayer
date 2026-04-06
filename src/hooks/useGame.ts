import { useContext } from 'react'
import { type GameContextType, GameContext } from '../contexts/GameContext'

export function useGame(): GameContextType {
  const context = useContext(GameContext)

  if (context === null) {
    throw new Error('useGame must be used within a GameProvider')
  }

  return context
}
