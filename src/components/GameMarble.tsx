import type { Marble, Position } from '../types/game'
import styles from '../styles/Game.module.css'

interface GameMarbleProps {
  marble: Marble
  position: Position
  isSelected: boolean
  isAnimating: boolean
}

export default function GameMarble({ marble, position, isSelected, isAnimating }: GameMarbleProps) {
  const marbleClasses = [
    styles.marble,
    marble.player === 'black' ? styles.marbleBlack : styles.marbleWhite,
    isSelected ? styles.marbleSelected : '',
    isAnimating ? styles.marbleAnimating : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={marbleClasses}
      style={{
        left: position.x + 10,
        top: position.y + 10,
        width: 40,
        height: 40,
      }}
    />
  )
}
