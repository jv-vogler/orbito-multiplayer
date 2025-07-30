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
  options?: { isGameScreen?: boolean }
) {
  const { isGameScreen = false } = options || {}

  const offlineGame = useOfflineGameLogic()

  const [playerColor, setPlayerColor] = useState<'black' | 'white' | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [isHost, setIsHost] = useState(false)

  const isPlayerStarting = playerColor && playerColor === 'black'

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

  // Step 2 - Initializes the game after colors are assigned
  useEffect(() => {
    if (isPlayerStarting) {
      setIsMyTurn(true)
    }
  }, [isPlayerStarting])

  // Step 3 - Actual external game state updates
  const onGameStateChange = useCallback((gameState: OnlineGameState | null) => {
    if (!gameState) return
  }, [])

  const animateRotation = async () => {
    if (!isMyTurn) return
    await offlineGame.animateRotation(() => console.log('Animation complete', { offlineGame }))
    console.log('2nd', { offlineGame })
  }

  const resetGame = () => {
    offlineGame.resetGame()
    console.log('Online: Game reset, will sync to Firebase')
  }

  const setGameState = useCallback(
    (newState: Parameters<typeof offlineGame.setGameState>[0]) => {
      offlineGame.setGameState(newState)
      console.log('Online: Game state set from remote update')
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

      if (!currentPlayer) {
        throw new Error('Current player not found in players list')
      }

      setPlayerColor(currentPlayer.color)
    },
    [playerId]
  )

  useEffect(() => {
    if (!roomId) return

    const unsubscribe = subscribeToRoomUpdates(roomId, {
      onGameStateChange,
      onPlayersChange,
    })

    return unsubscribe
  }, [onGameStateChange, onPlayersChange, roomId, setGameState])

  return {
    ...offlineGame,
    // Override functions that need online behavior
    animateRotation,
    resetGame,
    setGameState,
    // Online-specific properties
    playerColor,
    isMyTurn,
    isHost,
    // Online initialization and management
    initializeOnlineGame,
    setHostStatus,
  }
}
