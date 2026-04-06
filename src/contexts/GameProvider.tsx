import type { ReactNode } from 'react'
import { useOfflineGameLogic } from '../hooks/useOfflineGameLogic'
import { GameContext } from './GameContext'

interface GameProviderProps {
  children: ReactNode
}
export function GameProvider({ children }: GameProviderProps) {
  const gameLogic = useOfflineGameLogic()

  return <GameContext.Provider value={gameLogic}>{children}</GameContext.Provider>
}
