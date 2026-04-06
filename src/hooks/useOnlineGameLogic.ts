import { useCallback, useEffect, useState } from 'react'
import {
  subscribeToRoomUpdates,
  syncGameState,
  syncPlayerColors,
  type OnlineGameState,
} from '../services/gameStateService'
import type { Player as PlayerObject } from '../types/GameState'
import type { Marble, TurnStep, Winner, Player } from '../types/game'
import { useGame } from './useGame'

export function useOnlineGameLogic(
  roomId?: string,
  playerId?: string,
  options?: {
    player: PlayerObject | null
    onPlayerUpdate?: (player: PlayerObject) => void
  }
) {
  const { onPlayerUpdate } = options || {}

  const game = useGame()

  const [isHost, setIsHost] = useState(false)
  const [playerColor, setPlayerColor] = useState<Player | null>(null)
  const [isUpdatingFromRemote, setIsUpdatingFromRemote] = useState(false)
  const isMyTurn = playerColor === game.currentTurnColor

  const initializeOnlineGame = async () => {
    if (!isHost || !roomId || !playerId) {
      return
    }

    game.resetGame()

    const hostColor = Math.random() < 0.5 ? 'black' : 'white'

    await syncPlayerColors(roomId, { id: playerId, color: hostColor })
  }

  const animateRotation = async () => {
    if (!isMyTurn || !roomId || isUpdatingFromRemote || !playerId) return

    // Start local animation and get the final state
    const finalState = await game.animateRotation()

    // Sync the final state after animation completes
    if (finalState) {
      await syncGameState(roomId, {
        marbles: finalState.marbles,
        currentPlayer: finalState.currentTurnColor,
        turnStep: finalState.turnStep,
        winner: finalState.winner,
        rotationAttempts: finalState.rotationAttempts,
        turnNumber: finalState.turnNumber,
      })
    }
  }

  const handleCellClick = async (
    cell: number,
    callback?: () => void
  ): Promise<{
    marbles: Marble[]
    currentTurnColor: Player | null
    turnStep: TurnStep
    winner: Winner
    rotationAttempts: number
    turnNumber: number
  } | null> => {
    if (!isMyTurn || !roomId || !game.currentTurnColor || isUpdatingFromRemote) return null

    const updatedGameState = await game.handleCellClick(cell, callback)

    if (updatedGameState) {
      // Sync state for any move (enemy movement in step 1 or marble placement in step 2/3)
      await syncGameState(roomId, {
        marbles: updatedGameState.marbles,
        currentPlayer: updatedGameState.currentTurnColor,
        turnStep: updatedGameState.turnStep,
        winner: updatedGameState.winner,
        rotationAttempts: updatedGameState.rotationAttempts,
        turnNumber: updatedGameState.turnNumber,
      })
    }

    return updatedGameState
  }

  const resetGame = () => {
    game.resetGame()
  }

  const setGameState = useCallback(
    (newState: Parameters<typeof game.setGameState>[0]) => {
      game.setGameState(newState)
    },
    [game]
  )

  const setHostStatus = (hostStatus: boolean) => {
    setIsHost(hostStatus)
  }

  const onPlayersChange = useCallback(
    (players: PlayerObject[] | null) => {
      if (!players) return

      const currentPlayer = players.find((p) => p.id === playerId)

      if (!currentPlayer || !currentPlayer.color) {
        throw new Error('Current player not found in players list')
      }

      if (!playerColor) {
        setPlayerColor(currentPlayer.color)
        onPlayerUpdate?.(currentPlayer)
      }
    },
    [onPlayerUpdate, playerColor, playerId]
  )

  const onGameStateChange = useCallback(
    (gameState: OnlineGameState | null) => {
      if (!gameState) return

      setIsUpdatingFromRemote(true)

      // Check if this is a rotation (turnNumber increased)
      if (gameState.turnNumber > game.turnNumber) {
        // A rotation happened! Start local animation first, then apply the final state
        game.animateRotation().then(() => {
          // After animation completes, apply the received state
          game.setGameState({
            marbles: gameState.marbles,
            currentPlayer: gameState.currentPlayer,
            turnStep: gameState.turnStep,
            winner: gameState.winner,
            rotationAttempts: gameState.rotationAttempts,
            turnNumber: gameState.turnNumber,
            // Reset these to ensure full sync
            selectedEnemyMarbleId: null,
            animating: false,
          })
        })
      } else {
        // Regular state update (not a rotation)
        game.setGameState({
          marbles: gameState.marbles,
          currentPlayer: gameState.currentPlayer,
          turnStep: gameState.turnStep,
          winner: gameState.winner,
          rotationAttempts: gameState.rotationAttempts,
          turnNumber: gameState.turnNumber,
          // Reset these to ensure full sync
          selectedEnemyMarbleId: null,
          animating: false,
        })
      }

      setIsUpdatingFromRemote(false)
    },
    [game]
  )

  useEffect(() => {
    if (!roomId) return

    const unsubscribe = subscribeToRoomUpdates(roomId, {
      onGameStateChange,
      onPlayersChange,
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]) // Remove callback dependencies to prevent re-subscription

  return {
    ...game,
    // Override functions with online behavior
    animateRotation,
    resetGame,
    setGameState,
    handleCellClick,
    // Online-specific properties
    isMyTurn,
    isHost,
    playerColor,
    // Online initialization and management
    initializeOnlineGame,
    setHostStatus,
  }
}
