import { useEffect } from 'react'
import { useGameLogic } from './useGameLogic'
// TODO: Add Firestore imports when ready

export function useOnlineGame(gameId?: string) {
  const gameLogic = useGameLogic()

  // TODO: Add Firestore sync logic here
  // - Listen to game state changes
  // - Sync moves to Firestore
  // - Handle multiplayer turn management
  // - Manage player connections

  useEffect(() => {
    if (!gameId) return

    // TODO: Set up Firestore listeners
    // TODO: Sync initial game state

    return () => {
      // TODO: Cleanup Firestore listeners
    }
  }, [gameId])

  // For now, return the same interface as offline mode
  // Later we'll add online-specific methods like:
  // - joinGame, leaveGame, invitePlayer, etc.
  return {
    ...gameLogic,
    isOnline: true,
    gameId,
    // TODO: Add online-specific state and methods
  }
}
