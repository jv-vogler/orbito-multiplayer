import React from 'react'
import { GameScreen } from '../types/GameState'
import './MainMenu.css'

interface MainMenuProps {
  onNavigate: (screen: GameScreen) => void
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">ORBITO</h1>

        <div className="menu-buttons">
          <button className="menu-button primary" onClick={() => onNavigate(GameScreen.GAME)}>
            Play Offline
          </button>

          <button className="menu-button secondary" onClick={() => onNavigate(GameScreen.GAME)}>
            Play Online
            <span className="coming-soon">(Coming Soon)</span>
          </button>
        </div>

        <div className="game-info">
          <p>A strategic tile-placement game</p>
        </div>
      </div>
    </div>
  )
}
