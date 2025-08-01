import { createContext } from 'react'
import type { Marble, Player, TurnStep, Position, Winner } from '../types/game'

export interface GameContextType {
  // Game state
  marbles: Marble[]
  animating: boolean
  currentTurnColor: Player | null
  turnStep: TurnStep
  selectedEnemyMarbleId: string | null
  marblePositions: { [id: string]: Position }
  winner: Winner
  rotationAttempts: number

  // Game actions
  handleCellClick: (
    cell: number,
    callback?: () => void
  ) => Promise<{
    marbles: Marble[]
    currentTurnColor: Player | null
    turnStep: TurnStep
    winner: Winner
    rotationAttempts: number
  } | null>
  animateRotation: (callback?: () => void) => Promise<void>
  resetGame: () => void
  setGameState: (newState: {
    marbles?: Marble[]
    currentPlayer?: Player | null
    turnStep?: TurnStep
    selectedEnemyMarbleId?: string | null
    winner?: Winner
    rotationAttempts?: number
    animating?: boolean
  }) => void
  setCurrentTurnColor: (color: Player | null) => void
}

export const GameContext = createContext<GameContextType | null>(null)
