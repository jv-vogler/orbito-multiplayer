import { useCallback, useEffect, useState } from 'react'
import {
  subscribeToRoomUpdates,
  syncGameState,
  syncPlayerColors,
  type OnlineGameState,
} from '../services/gameStateService'
import { useOfflineGameLogic } from './useOfflineGameLogic'
import type { Player } from '../types/GameState'

export function useOnlineGameLogic(
  roomId?: string,
  playerId?: string,
  options?: { isGameScreen?: boolean }
) {
  const { isGameScreen = false } = options || {}

  const offlineGame = useOfflineGameLogic(null)

  const [isHost, setIsHost] = useState(false)
  const isMyTurn =
    offlineGame.currentPlayer && offlineGame.currentPlayer === offlineGame.currentPlayer

  // Debug
  useEffect(() => {
    if (!isGameScreen) return

    console.log({ offlineGame })
  }, [isGameScreen, offlineGame])

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

      offlineGame.setCurrentPlayer(currentPlayer.color)
    },
    [offlineGame, playerId]
  )

  const onGameStateChange = useCallback(
    (gameState: OnlineGameState | null) => {
      if (!gameState || !offlineGame.currentPlayer) return
    },
    [offlineGame.currentPlayer]
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
    animateRotation,
    resetGame,
    setGameState,
    // Online-specific properties
    isMyTurn,
    isHost,
    // Online initialization and management
    initializeOnlineGame,
    setHostStatus,
  }
}
