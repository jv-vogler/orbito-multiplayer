import GameBoard from './components/GameBoard'
import GameInfo from './components/GameInfo'
import { MAX_ROTATION_ATTEMPTS } from './constants/game'
import { useGameLogic } from './hooks/useGameLogic'
import styles from './styles/Game.module.css'

export default function OrbitoFixedMarbles() {
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
  } = useGameLogic()

  const canRotate = turnStep === 3 && !winner && rotationAttempts < MAX_ROTATION_ATTEMPTS

  return (
    <div className={styles.container}>
      <GameBoard
        marbles={marbles}
        marblePositions={marblePositions}
        turnStep={turnStep}
        selectedEnemyMarbleId={selectedEnemyMarbleId}
        animating={animating}
        winner={winner}
        onCellClick={handleCellClick}
      />

      <GameInfo
        currentPlayer={currentPlayer}
        turnStep={turnStep}
        winner={winner}
        rotationAttempts={rotationAttempts}
        marbleCount={marbles.length}
      />

      <button
        onClick={animateRotation}
        disabled={animating || !canRotate}
        className={`${styles.rotateButton} ${
          canRotate ? styles.rotateButtonVisible : styles.rotateButtonHidden
        }`}
      >
        Rotate Marbles {animating ? '(Animating...)' : ''}
      </button>
    </div>
  )
}
