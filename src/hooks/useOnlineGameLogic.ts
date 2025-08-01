import { useCallback, useEffect, useState } from 'react'
import {
  subscribeToRoomUpdates,
  syncGameState,
  syncPlayerColors,
  type OnlineGameState,
} from '../services/gameStateService'
import type { Player } from '../types/GameState'
import { useGame } from './useGame'

export function useOnlineGameLogic(
  roomId?: string,
  playerId?: string,
  options?: {
    player: Player | null
    onPlayerUpdate?: (player: Player) => void
  }
) {
  const { player, onPlayerUpdate } = options || {}

  const game = useGame()

  const [isHost, setIsHost] = useState(false)
  const [playerColor, setPlayerColor] = useState<Player['color']>(null)
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
    if (!isMyTurn) return
    await game.animateRotation()
  }

  const handleCellClick = async (cell: number, callback?: () => void): Promise<void> => {
    if (!isMyTurn || !roomId || !game.currentTurnColor || isUpdatingFromRemote) return

    const updatedGameState = await game.handleCellClick(cell, callback)

    if (updatedGameState && updatedGameState.turnStep === 3) {
      await syncGameState(roomId, {
        marbles: updatedGameState.marbles,
        currentPlayer: updatedGameState.currentTurnColor,
        turnStep: updatedGameState.turnStep,
        winner: updatedGameState.winner,
        rotationAttempts: updatedGameState.rotationAttempts,
      })
    }
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
    (players: Player[] | null) => {
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

      console.log('Game state updated:', { gameState, player, game })

      setIsUpdatingFromRemote(true)
      game.setGameState({
        marbles: gameState.marbles,
        currentPlayer: gameState.currentPlayer,
        turnStep: gameState.turnStep,
        winner: gameState.winner,
        rotationAttempts: gameState.rotationAttempts,
        // Reset these to ensure full sync
        selectedEnemyMarbleId: null,
        animating: false,
      })
      setIsUpdatingFromRemote(false)
    },
    [game, player]
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
