import { useState } from 'react'
import { GameScreen, type GameState } from '../types/GameState'

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentScreen: GameScreen.MENU,
    isOfflineMode: true,
  })

  const navigateToScreen = (screen: GameScreen) => {
    setGameState((prev) => ({
      ...prev,
      currentScreen: screen,
    }))
  }

  const setOfflineMode = (isOffline: boolean) => {
    setGameState((prev) => ({
      ...prev,
      isOfflineMode: isOffline,
    }))
  }

  return {
    gameState,
    navigateToScreen,
    setOfflineMode,
  }
}
