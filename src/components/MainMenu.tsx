import React from 'react'
import { GameScreen } from '../types/GameState'
import './MainMenu.css'

interface MainMenuProps {
  onNavigate: (screen: GameScreen, isOffline?: boolean) => void
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">ORBITO</h1>

        <div className="menu-buttons">
          <button className="menu-button primary" onClick={() => onNavigate(GameScreen.GAME, true)}>
            Play Offline
          </button>

          <div className="online-section">
            <h3 className="section-title">Online Play</h3>
            <button
              className="menu-button secondary"
              onClick={() => onNavigate(GameScreen.CREATE_ROOM, false)}
            >
              Create Room
            </button>

            <button
              className="menu-button secondary"
              onClick={() => onNavigate(GameScreen.JOIN_ROOM, false)}
            >
              Join Room
            </button>
          </div>
        </div>

        <div className="game-info">
          <p>A strategic tile-placement game</p>
        </div>
      </div>
    </div>
  )
}
