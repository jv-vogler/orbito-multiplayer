import { useState } from 'react'
import { useOfflineGameLogic } from './useOfflineGameLogic'

export function useOnlineGameLogic(roomId?: string, playerId?: string) {
  const offlineGame = useOfflineGameLogic()

  const [playerColor, setPlayerColor] = useState<'black' | 'white' | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(true)

  const handleCellClick = (cell: number) => {
    if (!isMyTurn) return
    offlineGame.handleCellClick(cell)
    console.log('Online: Cell clicked, will sync to Firebase')
  }

  const animateRotation = () => {
    if (!isMyTurn) return
    offlineGame.animateRotation()
    console.log('Online: Rotation triggered, will sync to Firebase')
  }

  const resetGame = () => {
    offlineGame.resetGame()
    console.log('Online: Game reset, will sync to Firebase')
  }

  const setGameState = (newState: Parameters<typeof offlineGame.setGameState>[0]) => {
    offlineGame.setGameState(newState)
    console.log('Online: Game state set from remote update')
  }

  const calculateIsMyTurn = () => {
    if (!playerColor) return false
    return offlineGame.currentPlayer === playerColor
  }

  return {
    ...offlineGame,
    // Override functions that need online behavior
    handleCellClick,
    animateRotation,
    resetGame,
    setGameState,
    // Online-specific properties
    playerColor,
    isMyTurn: calculateIsMyTurn(),
  }
}
