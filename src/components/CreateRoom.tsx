import React, { useState } from 'react'
import { GameScreen } from '../types/GameState'
import './RoomComponents.css'

interface CreateRoomProps {
  onNavigate: (screen: GameScreen) => void
  onCreateRoom: (roomName: string, playerName: string) => void
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ onNavigate, onCreateRoom }) => {
  const [roomName, setRoomName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim() && playerName.trim()) {
      setIsCreating(true)
      setError(null)
      
      try {
        await onCreateRoom(roomName.trim(), playerName.trim())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create room')
        setIsCreating(false)
      }
    }
  }

  return (
    <div className="room-screen">
      <div className="room-container">
        <h2>Create Room</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

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
              disabled={isCreating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomName">Room Name</label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              maxLength={30}
              required
              disabled={isCreating}
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="menu-button primary"
              disabled={!roomName.trim() || !playerName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
            <button
              type="button"
              className="menu-button secondary"
              onClick={() => onNavigate(GameScreen.MENU)}
              disabled={isCreating}
            >
              Back
            </button>
          </div>
        </form>

        <div className="room-info">
          <p>Create a room and share the Room ID with your friend!</p>
        </div>
      </div>
    </div>
  )
}
