import { doc, updateDoc, onSnapshot, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { GameState } from '../types/game'
import type { Player } from '../types/GameState'

interface FirestorePlayer {
  id: string
  name: string
  color: 'black' | 'white' | null
  isHost: boolean
  lastSeen: Timestamp
}

interface FirestoreRoomData {
  name: string
  players: FirestorePlayer[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  createdBy: string
  createdAt: Timestamp
  gameState?: OnlineGameState
}

/**
 * Service for managing game state synchronization
 * Provides strongly typed wrappers around Firebase operations
 */

export interface OnlineGameState {
  marbles: GameState['marbles']
  currentPlayer: GameState['currentPlayer']
  turnStep: GameState['turnStep']
  winner: GameState['winner']
  rotationAttempts: GameState['rotationAttempts']
}

export interface PlayerColorAssignment {
  playerId: string
  color: 'black' | 'white'
}

/**
 * Update the game state in Firebase
 */
export async function syncGameState(roomId: string, gameState: OnlineGameState): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    await updateDoc(roomRef, {
      gameState: gameState,
    })
  } catch (error) {
    console.error('Error syncing game state:', error)
    throw new Error('Failed to sync game state')
  }
}

/**
 * Assign player colors based on host's choice
 * Receives host as an object { id, color }
 */
export async function syncPlayerColors(
  roomId: string,
  host: { id: string; color: 'black' | 'white' }
): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomSnap = await getDoc(roomRef)
    if (!roomSnap.exists()) {
      throw new Error('Room not found')
    }
    const roomData = roomSnap.data() as FirestoreRoomData
    const otherColor = host.color === 'black' ? 'white' : 'black'
    const updatedPlayers =
      roomData?.players?.map((player: FirestorePlayer) => {
        if (player.id === host.id) {
          return { ...player, color: host.color }
        } else {
          return { ...player, color: otherColor }
        }
      }) || []
    await updateDoc(roomRef, {
      players: updatedPlayers,
    })
  } catch (error) {
    console.error('Error syncing player colors:', error)
    throw new Error('Failed to sync player colors')
  }
}

/**
 * Subscribe to room updates - receives callbacks inside an object
 */
export function subscribeToRoomUpdates(
  roomId: string,
  callbacks: {
    onGameStateChange: (gameState: OnlineGameState | null) => void
    onPlayersChange: (players: Player[]) => void
  }
): () => void {
  const roomRef = doc(db, 'rooms', roomId)

  return onSnapshot(
    roomRef,
    (doc) => {
      if (!doc.exists()) {
        callbacks.onGameStateChange(null)
        callbacks.onPlayersChange([])
        return
      }

      const data = doc.data() as FirestoreRoomData

      // Game State callback
      const gameState = data.gameState
      callbacks.onGameStateChange(gameState || null)

      // Players callback
      const players =
        data.players?.map((p: FirestorePlayer) => ({
          ...p,
          lastSeen: p.lastSeen?.toDate?.() || new Date(),
        })) || []
      callbacks.onPlayersChange(players)
    },
    (error) => {
      console.error('Error listening to room updates:', error)
      callbacks.onGameStateChange(null)
      callbacks.onPlayersChange([])
    }
  )
}
