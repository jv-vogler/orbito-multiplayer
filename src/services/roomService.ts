import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Room, Player } from '../types/GameState'
import type { GameState as GamePlayState } from '../types/game'

export interface FirestoreRoom extends Omit<Room, 'createdAt' | 'players'> {
  createdAt: Timestamp
  players: FirestorePlayer[]
  gameState?: GamePlayState
}

export interface FirestorePlayer extends Omit<Player, 'lastSeen'> {
  lastSeen: Timestamp
}

// Room management functions
export async function createRoom(
  roomName: string,
  hostPlayerName: string
): Promise<{ room: Room; player: Player }> {
  const playerId = generatePlayerId()

  const player: FirestorePlayer = {
    id: playerId,
    name: hostPlayerName,
    color: null,
    isHost: true,
    lastSeen: Timestamp.now(),
  }

  const roomData: Omit<FirestoreRoom, 'id'> = {
    name: roomName,
    players: [player],
    maxPlayers: 2,
    status: 'waiting',
    createdBy: playerId,
    createdAt: Timestamp.now(),
  }

  try {
    const docRef = await addDoc(collection(db, 'rooms'), roomData)

    const room: Room = {
      id: docRef.id,
      name: roomName,
      players: [{ ...player, lastSeen: player.lastSeen.toDate() }],
      maxPlayers: 2,
      status: 'waiting',
      createdBy: playerId,
      createdAt: new Date(),
    }

    return { room, player: { ...player, lastSeen: player.lastSeen.toDate() } }
  } catch (error) {
    console.error('Error creating room:', error)
    throw new Error('Failed to create room')
  }
}

export async function joinRoom(
  roomId: string,
  playerName: string
): Promise<{ room: Room; player: Player }> {
  const playerId = generatePlayerId()

  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomSnap = await getDoc(roomRef)

    if (!roomSnap.exists()) {
      throw new Error('Room not found')
    }

    const roomData = roomSnap.data() as FirestoreRoom

    if (roomData.players.length >= roomData.maxPlayers) {
      throw new Error('Room is full')
    }

    if (roomData.status !== 'waiting') {
      throw new Error('Game already in progress')
    }

    const newPlayer: FirestorePlayer = {
      id: playerId,
      name: playerName,
      color: null,
      isHost: false,
      lastSeen: Timestamp.now(),
    }

    const updatedPlayers = [...roomData.players, newPlayer]

    await updateDoc(roomRef, {
      players: updatedPlayers,
    })

    const room: Room = {
      id: roomId,
      name: roomData.name,
      players: updatedPlayers.map((p) => ({ ...p, lastSeen: new Date() })),
      maxPlayers: roomData.maxPlayers,
      status: roomData.status,
      createdBy: roomData.createdBy,
      createdAt: roomData.createdAt.toDate(),
    }

    return { room, player: { ...newPlayer, lastSeen: newPlayer.lastSeen.toDate() } }
  } catch (error) {
    console.error('Error joining room:', error)
    throw error
  }
}

export async function leaveRoom(roomId: string, playerId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    const roomSnap = await getDoc(roomRef)

    if (!roomSnap.exists()) {
      return // Room doesn't exist, nothing to do
    }

    const roomData = roomSnap.data() as FirestoreRoom
    const updatedPlayers = roomData.players.filter((p) => p.id !== playerId)

    if (updatedPlayers.length === 0) {
      // No players left, delete the room
      await deleteDoc(roomRef)
    } else {
      // Update the room with remaining players
      // If the host left, make the first remaining player the host
      if (roomData.createdBy === playerId && updatedPlayers.length > 0) {
        updatedPlayers[0].isHost = true
        await updateDoc(roomRef, {
          players: updatedPlayers,
          createdBy: updatedPlayers[0].id,
        })
      } else {
        await updateDoc(roomRef, {
          players: updatedPlayers,
        })
      }
    }
  } catch (error) {
    console.error('Error leaving room:', error)
    throw new Error('Failed to leave room')
  }
}

export async function startGame(roomId: string, gameState: GamePlayState): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId)

    const roomSnap = await getDoc(roomRef)
    if (!roomSnap.exists()) {
      throw new Error('Room not found')
    }

    await updateDoc(roomRef, {
      status: 'playing',
      gameState: gameState,
    })
  } catch (error) {
    console.error('Error starting game:', error)
    throw new Error('Failed to start game')
  }
}

export async function updateGameState(roomId: string, gameState: GamePlayState): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    await updateDoc(roomRef, {
      gameState: gameState,
    })
  } catch (error) {
    console.error('Error updating game state:', error)
    throw new Error('Failed to update game state')
  }
}

export function subscribeToRoom(roomId: string, callback: (room: Room | null) => void): () => void {
  const roomRef = doc(db, 'rooms', roomId)

  return onSnapshot(
    roomRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data() as FirestoreRoom
        const room: Room = {
          id: doc.id,
          name: data.name,
          players: data.players.map((p) => ({ ...p, lastSeen: p.lastSeen.toDate() })),
          maxPlayers: data.maxPlayers,
          status: data.status,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
        }
        callback(room)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error listening to room:', error)
      callback(null)
    }
  )
}

export function subscribeToGameState(
  roomId: string,
  callback: (gameState: GamePlayState | null) => void
): () => void {
  const roomRef = doc(db, 'rooms', roomId)

  return onSnapshot(
    roomRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data() as FirestoreRoom
        callback(data.gameState || null)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error listening to game state:', error)
      callback(null)
    }
  )
}

// WebRTC Signaling Support
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  fromPlayer: string
  toPlayer: string
  data: RTCSessionDescriptionInit | RTCIceCandidateInit
  timestamp: Timestamp
}

// Send WebRTC signaling message
export async function sendSignalingMessage(
  roomId: string,
  message: Omit<SignalingMessage, 'timestamp'>
): Promise<void> {
  try {
    const signalingRef = collection(db, 'rooms', roomId, 'signaling')
    await addDoc(signalingRef, {
      ...message,
      timestamp: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error sending signaling message:', error)
    throw new Error('Failed to send signaling message')
  }
}

// Subscribe to WebRTC signaling messages
export function subscribeToSignaling(
  roomId: string,
  playerId: string,
  callback: (message: SignalingMessage) => void
): () => void {
  const signalingRef = collection(db, 'rooms', roomId, 'signaling')

  return onSnapshot(
    signalingRef,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as SignalingMessage
          // Only process messages addressed to this player
          if (data.toPlayer === playerId) {
            callback(data)
            // Delete the message after processing to keep the collection clean
            deleteDoc(change.doc.ref).catch((error) => {
              console.error('Error deleting signaling message:', error)
            })
          }
        }
      })
    },
    (error) => {
      console.error('Error listening to signaling:', error)
    }
  )
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
