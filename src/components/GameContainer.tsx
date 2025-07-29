import React from 'react';
import { GameScreen } from '../types/GameState';
import './GameContainer.css';

interface GameContainerProps {
  onNavigate: (screen: GameScreen) => void;
  children: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({ onNavigate, children }) => {
  return (
    <div className="game-container">
      <div className="game-header">
        <button 
          className="back-button"
          onClick={() => onNavigate(GameScreen.MENU)}
        >
          ← Back to Menu
        </button>
      </div>
      <div className="game-content">
        {children}
      </div>
    </div>
  );
};
