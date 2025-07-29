export type Player = 'black' | 'white'
export type TurnStep = 1 | 2 | 3
export type Winner = Player | 'draw' | null

export interface Marble {
  id: string
  cell: number
  player: Player
}

export interface Position {
  x: number
  y: number
}

export interface GameState {
  marbles: Marble[]
  currentPlayer: Player
  turnStep: TurnStep
  selectedEnemyMarbleId: string | null
  winner: Winner
  rotationAttempts: number
  animating: boolean
}
