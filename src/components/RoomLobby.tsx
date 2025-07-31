import React, { useEffect, useState } from 'react'
import { GameScreen, type Room, type Player } from '../types/GameState'
import { leaveRoom, startGame, subscribeToRoom } from '../services/roomService'
import './RoomComponents.css'

interface RoomLobbyProps {
  room: Room
  currentPlayer: Player
  onNavigate: (screen: GameScreen) => void
  onGameStart: (room: Room) => void
  onLeaveRoom: () => void
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  room: initialRoom,
  currentPlayer,
  onNavigate,
  onGameStart,
  onLeaveRoom,
}) => {
  const [room, setRoom] = useState<Room>(initialRoom)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToRoom(room.id, (updatedRoom) => {
      if (updatedRoom) {
        setRoom(updatedRoom)

        // If game started, navigate to game screen
        if (updatedRoom.status === 'playing') {
          onGameStart(updatedRoom)
        }
      } else {
        // Room was deleted
        setError('Room no longer exists')
        setTimeout(() => {
          onNavigate(GameScreen.MENU)
        }, 2000)
      }
    })

    return unsubscribe
  }, [room.id, onGameStart, onNavigate])

  const handleStartGame = async () => {
    if (room.players.length < 2) {
      setError('Need 2 players to start the game')
      return
    }

    if (!currentPlayer.isHost) {
      setError('Only the host can start the game')
      return
    }

    setIsStarting(true)
    setError(null)

    try {
      const initialGameState = {
        marbles: [],
        currentPlayer: 'black' as const,
        turnStep: 1 as const,
        selectedEnemyMarbleId: null,
        winner: null,
        rotationAttempts: 0,
        animating: false,
      }

      await startGame(room.id, initialGameState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
      setIsStarting(false)
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(room.id, currentPlayer.id)
      onLeaveRoom()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room')
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id).then(() => {
      // Could add a toast notification here
    })
  }

  const canStartGame = room.players.length === 2 && currentPlayer.isHost && !isStarting

  return (
    <div className="room-screen">
      <div className="room-container">
        <div className="room-header">
          <h2>{room.name}</h2>
          <div className="room-id">
            <span>Room ID: {room.id}</span>
            <button onClick={copyRoomId} className="copy-button" title="Copy room ID">
              📋
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="players-section">
          <h3>
            Players ({room.players.length}/{room.maxPlayers})
          </h3>
          <div className="players-list">
            {room.players.map((player) => (
              <div key={player.id} className="player-item">
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  {player.isHost && <span className="host-badge">Host</span>}
                  {player.id === currentPlayer.id && <span className="you-badge">You</span>}
                </div>
                {player.color && (
                  <div className={`player-color ${player.color}`}>{player.color}</div>
                )}
              </div>
            ))}

            {room.players.length < room.maxPlayers && (
              <div className="waiting-slot">
                <span>Waiting for player...</span>
              </div>
            )}
          </div>
        </div>

        <div className="room-actions">
          {canStartGame && (
            <button onClick={handleStartGame} className="menu-button primary" disabled={isStarting}>
              {isStarting ? 'Starting...' : 'Start Game'}
            </button>
          )}

          {!currentPlayer.isHost && room.players.length < 2 && (
            <div className="waiting-message">Waiting for host to start the game...</div>
          )}

          <button onClick={handleLeaveRoom} className="menu-button secondary">
            Leave Room
          </button>

          <button onClick={() => onNavigate(GameScreen.MENU)} className="menu-button tertiary">
            Back to Menu
          </button>
        </div>

        <div className="room-info">
          <p>Share the Room ID with your friend to let them join!</p>
        </div>
      </div>
    </div>
  )
}
