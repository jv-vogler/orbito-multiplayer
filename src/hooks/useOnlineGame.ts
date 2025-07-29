import { useState, useEffect, useCallback } from 'react'
import { subscribeToRoom, subscribeToGameState, updateGameState } from '../services/roomService'
import { useGameLogic } from './useGameLogic'
import type { GameState as GamePlayState } from '../types/game'

export function useOnlineGame(roomId?: string, playerId?: string) {
  const gameLogic = useGameLogic()
  const [isOnlineGameState, setIsOnlineGameState] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  const [playerColor, setPlayerColor] = useState<'black' | 'white' | null>(null)

  // Subscribe to room changes to get player color assignment
  useEffect(() => {
    if (!roomId || !playerId) return

    const unsubscribe = subscribeToRoom(roomId, (room) => {
      if (!room) return

      const currentPlayer = room.players.find((p) => p.id === playerId)
      if (currentPlayer && currentPlayer.color) {
        setPlayerColor(currentPlayer.color)
      }
    })

    return unsubscribe
  }, [roomId, playerId])

  // Check if it's the current player's turn
  const isMyTurn = useCallback(() => {
    if (!playerColor || !isOnlineGameState) return true
    return gameLogic.currentPlayer === playerColor
  }, [playerColor, isOnlineGameState, gameLogic.currentPlayer])

  // Override handleCellClick to check turn and sync
  const handleCellClick = useCallback((cellIndex: number) => {
    if (!isMyTurn()) {
      console.log('Not your turn!')
      return
    }
    gameLogic.handleCellClick(cellIndex)
  }, [isMyTurn, gameLogic])

  // Override animateRotation to check turn and sync
  const animateRotation = useCallback(() => {
    if (!isMyTurn()) {
      console.log('Not your turn!')
      return
    }
    gameLogic.animateRotation()
  }, [isMyTurn, gameLogic])

  // Sync game state to Firestore when local state changes
  const syncToFirestore = useCallback(async () => {
    if (!roomId || !isOnlineGameState) return

    try {
      const currentGameState: GamePlayState = {
        marbles: gameLogic.marbles,
        currentPlayer: gameLogic.currentPlayer,
        turnStep: gameLogic.turnStep,
        selectedEnemyMarbleId: gameLogic.selectedEnemyMarbleId,
        winner: gameLogic.winner,
        rotationAttempts: gameLogic.rotationAttempts,
        animating: gameLogic.animating,
      }

      await updateGameState(roomId, currentGameState)
      setLastUpdateTime(Date.now())
    } catch (error) {
      console.error('Failed to sync game state:', error)
    }
  }, [roomId, isOnlineGameState, gameLogic])

  // Subscribe to Firestore game state changes
  useEffect(() => {
    if (!roomId) return

    const unsubscribe = subscribeToGameState(roomId, (gameState) => {
      if (!gameState) return

      // Avoid infinite loops by checking if this update came from us
      const updateAge = Date.now() - lastUpdateTime
      if (updateAge < 1000) return // Skip updates within 1 second of our last update

      setIsOnlineGameState(true)
      
      // Apply the remote game state to local state
      gameLogic.setGameState({
        marbles: gameState.marbles,
        currentPlayer: gameState.currentPlayer,
        turnStep: gameState.turnStep,
        selectedEnemyMarbleId: gameState.selectedEnemyMarbleId,
        winner: gameState.winner,
        rotationAttempts: gameState.rotationAttempts,
        animating: gameState.animating,
      })
    })

    return unsubscribe
  }, [roomId, lastUpdateTime, gameLogic])

  // Sync local changes to Firestore
  useEffect(() => {
    if (isOnlineGameState) {
      syncToFirestore()
    }
  }, [
    gameLogic.marbles,
    gameLogic.currentPlayer,
    gameLogic.turnStep,
    gameLogic.selectedEnemyMarbleId,
    gameLogic.winner,
    gameLogic.rotationAttempts,
    syncToFirestore,
    isOnlineGameState
  ])

  const initializeOnlineGame = useCallback((initialState?: GamePlayState) => {
    setIsOnlineGameState(true)
    if (initialState) {
      gameLogic.setGameState(initialState)
    }
  }, [gameLogic])

  return {
    ...gameLogic,
    // Override with turn-aware versions
    handleCellClick,
    animateRotation,
    // Online-specific properties
    isOnline: !!roomId,
    roomId,
    playerId,
    playerColor,
    isMyTurn: isMyTurn(),
    initializeOnlineGame,
    syncToFirestore,
  }
}
