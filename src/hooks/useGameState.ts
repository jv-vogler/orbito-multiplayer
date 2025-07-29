import { useState } from 'react'
import { GameScreen, type GameState, type Room, type Player } from '../types/GameState'

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentScreen: GameScreen.MENU,
    isOfflineMode: true,
  })

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)

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

  const setRoomData = (room: Room, player: Player) => {
    setCurrentRoom(room)
    setCurrentPlayer(player)
    setGameState((prev) => ({
      ...prev,
      roomId: room.id,
      playerId: player.id,
    }))
  }

  const clearRoomData = () => {
    setCurrentRoom(null)
    setCurrentPlayer(null)
    setGameState((prev) => ({
      ...prev,
      roomId: undefined,
      playerId: undefined,
    }))
  }

  return {
    gameState,
    currentRoom,
    currentPlayer,
    navigateToScreen,
    setOfflineMode,
    setRoomData,
    clearRoomData,
  }
}
