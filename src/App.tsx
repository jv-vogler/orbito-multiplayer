import GameBoard from './components/GameBoard'
import { GameContainer } from './components/GameContainer'
import GameInfo from './components/GameInfo'
import { MainMenu } from './components/MainMenu'
import { useGameLogic } from './hooks/useGameLogic'
import { useGameState } from './hooks/useGameState'
import styles from './styles/Game.module.css'
import { GameScreen } from './types/GameState'

export default function OrbitoFixedMarbles() {
  const { gameState, navigateToScreen } = useGameState()

  const {
    marbles,
    animating,
    currentPlayer,
    turnStep,
    selectedEnemyMarbleId,
    marblePositions,
    winner,
    rotationAttempts,
    handleCellClick,
    animateRotation,
    resetGame,
  } = useGameLogic()

  const handleNavigateToGame = () => {
    resetGame()
    navigateToScreen(GameScreen.GAME)
  }

  if (gameState.currentScreen === GameScreen.MENU) {
    return (
      <MainMenu
        onNavigate={(screen) => {
          if (screen === GameScreen.GAME) {
            handleNavigateToGame()
          } else {
            navigateToScreen(screen)
          }
        }}
      />
    )
  }

  return (
    <GameContainer onNavigate={navigateToScreen}>
      <div className={styles.container}>
        {winner && (
          <div
            className={`${styles.winner} ${
              styles[`winner${winner === 'draw' ? 'Draw' : winner === 'black' ? 'Black' : 'White'}`]
            }`}
          >
            {winner === 'draw'
              ? "It's a draw!"
              : `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`}
          </div>
        )}

        <div className={styles.gameContent}>
          <GameBoard
            marbles={marbles}
            marblePositions={marblePositions}
            turnStep={turnStep}
            selectedEnemyMarbleId={selectedEnemyMarbleId}
            animating={animating}
            winner={winner}
            rotationAttempts={rotationAttempts}
            onCellClick={handleCellClick}
            onRotate={animateRotation}
          />

          <GameInfo
            currentPlayer={currentPlayer}
            turnStep={turnStep}
            winner={winner}
            rotationAttempts={rotationAttempts}
            marbleCount={marbles.length}
          />
        </div>
      </div>
    </GameContainer>
  )
}
