import React, { useState } from 'react'
import { GameScreen } from '../types/GameState'
import './RoomComponents.css'

interface JoinRoomProps {
  onNavigate: (screen: GameScreen) => void
  onJoinRoom: (roomId: string, playerName: string) => void
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onNavigate, onJoinRoom }) => {
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId.trim() && playerName.trim()) {
      setIsJoining(true)
      setError(null)

      try {
        await onJoinRoom(roomId.trim(), playerName.trim())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join room')
        setIsJoining(false)
      }
    }
  }

  return (
    <div className="room-screen">
      <div className="room-container">
        <h2>Join Room</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              required
              disabled={isJoining}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              required
              disabled={isJoining}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="menu-button primary"
              disabled={!roomId.trim() || !playerName.trim() || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate(GameScreen.MENU)}
              className="menu-button secondary"
              disabled={isJoining}
            >
              Back
            </button>
          </div>
        </form>

        <div className="room-info">
          <p>Ask your friend for the Room ID to join their game!</p>
        </div>
      </div>
    </div>
  )
}
