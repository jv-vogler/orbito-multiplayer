import { BOARD_SIZE, MAX_ROTATION_ATTEMPTS, stepTextMap } from '../constants/game'
import type { Player, TurnStep, Winner } from '../types/game'
import styles from '../styles/Game.module.css'

interface GameInfoProps {
  currentPlayer: Player
  turnStep: TurnStep
  winner: Winner
  rotationAttempts: number
  marbleCount: number
}

export default function GameInfo({
  currentPlayer,
  turnStep,
  winner,
  rotationAttempts,
  marbleCount,
}: GameInfoProps) {
  return (
    <>
      <div className={styles.gameInfo}>
        Current Player: {currentPlayer === 'black' ? 'Black' : 'White'}
      </div>

      <div className={styles.steps}>
        {([1, 2, 3] as const).map((step) => (
          <div key={step} className={turnStep === step ? styles.stepActive : styles.stepInactive}>
            {stepTextMap[step]}
          </div>
        ))}
      </div>

      {winner ? (
        <div
          className={`${styles.winner} ${
            styles[`winner${winner === 'draw' ? 'Draw' : winner === 'black' ? 'Black' : 'White'}`]
          }`}
        >
          {winner === 'draw'
            ? "It's a draw!"
            : `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`}
        </div>
      ) : marbleCount === BOARD_SIZE * BOARD_SIZE ? (
        <div className={styles.rotationInfo}>
          Rotation attempts left: {MAX_ROTATION_ATTEMPTS - rotationAttempts}
        </div>
      ) : null}
    </>
  )
}
