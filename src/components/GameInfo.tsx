import { BOARD_SIZE, MAX_ROTATION_ATTEMPTS, stepTextMap } from '../constants/game'
import type { Player, TurnStep, Winner } from '../types/game'
import styles from '../styles/Game.module.css'

interface GameInfoProps {
  currentPlayer: Player | null
  turnStep: TurnStep
  winner: Winner
  rotationAttempts: number
  marbleCount: number
  isOnline?: boolean
  isWaiting: boolean
}

export default function GameInfo({
  currentPlayer,
  turnStep,
  winner,
  rotationAttempts,
  marbleCount,
  isWaiting = false,
  isOnline = false,
}: GameInfoProps) {
  const canRotate = turnStep === 3 && !winner && rotationAttempts < MAX_ROTATION_ATTEMPTS

  return (
    <div className={styles.gameInfoPanel}>
      <div className={styles.gameInfo}>
        {currentPlayer
          ? `Current Player: ${currentPlayer === 'black' ? 'Black' : 'White'}`
          : isOnline
          ? 'Waiting for game to start...'
          : 'Current Player: Black'}
      </div>

      <div className={`${styles.waitingMessage} ${isOnline && isWaiting ? styles.waitingMessageVisible : styles.waitingMessageHidden}`}>
        Waiting for opponent's move...
      </div>

      <div className={styles.steps}>
        {([1, 2, 3] as const).map((step) => (
          <div key={step} className={turnStep === step ? styles.stepActive : styles.stepInactive}>
            {stepTextMap[step]}
          </div>
        ))}
      </div>

      {marbleCount === BOARD_SIZE * BOARD_SIZE && !winner ? (
        <div className={styles.rotationInfo}>
          Rotation attempts left: {MAX_ROTATION_ATTEMPTS - rotationAttempts}
        </div>
      ) : null}

      <div className={`${styles.keyboardHint} ${canRotate ? styles.keyboardHintActive : ''}`}>
        Press SPACE to rotate the board
      </div>
    </div>
  )
}
