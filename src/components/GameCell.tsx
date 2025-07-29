import { CELL_SIZE } from '../constants/game'
import { getCellPosition, areCellsAdjacent, getRotationDirection } from '../utils/gameUtils'
import type { Marble, TurnStep, Winner } from '../types/game'
import styles from '../styles/Game.module.css'

interface GameCellProps {
  cellIndex: number
  marbles: Marble[]
  turnStep: TurnStep
  selectedEnemyMarbleId: string | null
  animating: boolean
  winner: Winner
  onCellClick: (cell: number) => void
}

export default function GameCell({
  cellIndex,
  marbles,
  turnStep,
  selectedEnemyMarbleId,
  animating,
  winner,
  onCellClick,
}: GameCellProps) {
  const { x, y } = getCellPosition(cellIndex)
  const hasMarble = marbles.some((m) => m.cell === cellIndex)
  const marble = marbles.find((m) => m.cell === cellIndex)
  const isSelectedEnemy = selectedEnemyMarbleId === marble?.id
  const rotationDirection = getRotationDirection(cellIndex)

  const isClickable =
    !animating &&
    !winner &&
    !(turnStep === 1 && !isSelectedEnemy && hasMarble) &&
    !(turnStep === 2 && hasMarble)

  const isHighlighted =
    turnStep === 1 &&
    selectedEnemyMarbleId &&
    !hasMarble &&
    areCellsAdjacent(cellIndex, marbles.find((m) => m.id === selectedEnemyMarbleId)!.cell)

  const cellClasses = [
    styles.cell,
    isClickable ? styles.cellClickable : styles.cellDefault,
    isHighlighted ? styles.cellHighlighted : '',
    isSelectedEnemy ? styles.cellSelected : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      onClick={() => onCellClick(cellIndex)}
      className={cellClasses}
      style={{
        left: x,
        top: y,
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
    >
      <div
        className={`${styles.rotationIndicator} ${
          styles[
            `indicator${rotationDirection.charAt(0).toUpperCase() + rotationDirection.slice(1)}`
          ]
        }`}
      />
    </div>
  )
}
