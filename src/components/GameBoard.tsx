import { BOARD_SIZE, CELL_SIZE } from '../constants/game'
import { getCellPosition } from '../utils/gameUtils'
import type { Marble, TurnStep, Winner, Position } from '../types/game'
import GameCell from './GameCell'
import GameMarble from './GameMarble'
import styles from '../styles/Game.module.css'

interface GameBoardProps {
  marbles: Marble[]
  marblePositions: { [id: string]: Position }
  turnStep: TurnStep
  selectedEnemyMarbleId: string | null
  animating: boolean
  winner: Winner
  onCellClick: (cell: number) => void
}

export default function GameBoard({
  marbles,
  marblePositions,
  turnStep,
  selectedEnemyMarbleId,
  animating,
  winner,
  onCellClick,
}: GameBoardProps) {
  return (
    <div
      className={styles.board}
      style={{
        width: BOARD_SIZE * CELL_SIZE,
        height: BOARD_SIZE * CELL_SIZE,
      }}
    >
      {[...Array(BOARD_SIZE * BOARD_SIZE)].map((_, i) => (
        <GameCell
          key={i}
          cellIndex={i}
          marbles={marbles}
          turnStep={turnStep}
          selectedEnemyMarbleId={selectedEnemyMarbleId}
          animating={animating}
          winner={winner}
          onCellClick={onCellClick}
        />
      ))}

      {marbles.map((marble) => {
        const position = marblePositions[marble.id] ?? getCellPosition(0)
        const isSelected = selectedEnemyMarbleId === marble.id
        return (
          <GameMarble
            key={marble.id}
            marble={marble}
            position={position}
            isSelected={isSelected}
            isAnimating={animating}
          />
        )
      })}
    </div>
  )
}
