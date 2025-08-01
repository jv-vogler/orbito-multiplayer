import { useCallback, useEffect, useState } from 'react'
import {
  subscribeToRoomUpdates,
  syncPlayerColors,
  type OnlineGameState,
} from '../services/gameStateService'
import { useOfflineGameLogic } from './useOfflineGameLogic'
import type { Player } from '../types/GameState'

export function useOnlineGameLogic(
  roomId?: string,
  playerId?: string,
  options?: {
    player: Player | null
    onPlayerUpdate?: (player: Player) => void
  }
) {
  const { player, onPlayerUpdate } = options || {}

  const offlineGame = useOfflineGameLogic()

  const [isHost, setIsHost] = useState(false)
  const playerColor = player?.color ?? null
  const isMyTurn = true

  // Step 1 - Set players colors
  const initializeOnlineGame = async () => {
    if (!isHost || !roomId || !playerId) {
      return
    }

    offlineGame.resetGame()

    const hostColor = Math.random() < 0.5 ? 'black' : 'white'

    await syncPlayerColors(roomId, { id: playerId, color: hostColor })
  }

  const animateRotation = async () => {
    if (!isMyTurn) return
    await offlineGame.animateRotation()
  }

  const handleCellClick = async (_cell: number, callback?: () => void): Promise<void> => {
    if (!isMyTurn) return
    if (offlineGame.animating || offlineGame.winner) {
      callback?.()
      return
    }
  }

  const resetGame = () => {
    offlineGame.resetGame()
  }

  const setGameState = useCallback(
    (newState: Parameters<typeof offlineGame.setGameState>[0]) => {
      offlineGame.setGameState(newState)
    },
    [offlineGame]
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

      offlineGame.setCurrentTurnColor(currentPlayer.color)

      if (player?.color !== currentPlayer.color) {
        onPlayerUpdate?.(currentPlayer)
      }
    },
    [offlineGame, playerId, onPlayerUpdate, player?.color]
  )

  const onGameStateChange = useCallback(
    (gameState: OnlineGameState | null) => {
      if (!gameState || !offlineGame.currentTurnColor) return
    },
    [offlineGame.currentTurnColor]
  )

  useEffect(() => {
    if (!roomId) return

    const unsubscribe = subscribeToRoomUpdates(roomId, {
      onGameStateChange,
      onPlayersChange,
    })

    return unsubscribe
  }, [onGameStateChange, onPlayersChange, roomId])

  return {
    ...offlineGame,
    // Override functions that need online behavior
    // animateRotation,
    // resetGame,
    // setGameState,
    // handleCellClick,
    // Online-specific properties
    isMyTurn,
    isHost,
    playerColor,
    // Online initialization and management
    initializeOnlineGame,
    setHostStatus,
  }
}
