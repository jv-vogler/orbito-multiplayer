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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim() && playerName.trim()) {
      onCreateRoom(roomName.trim(), playerName.trim())
    }
  }

  return (
    <div className="room-screen">
      <div className="room-container">
        <h2>Create Room</h2>

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
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="room-button primary">
              Create Room
            </button>
            <button
              type="button"
              className="room-button secondary"
              onClick={() => onNavigate(GameScreen.MENU)}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
