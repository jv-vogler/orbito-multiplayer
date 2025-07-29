export const GameScreen = {
  MENU: 'menu',
  ROOM_LOBBY: 'room_lobby',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  GAME: 'game',
} as const

export type GameScreen = (typeof GameScreen)[keyof typeof GameScreen]

export interface GameState {
  currentScreen: GameScreen
  isOfflineMode: boolean
  roomId?: string
  playerId?: string
}

export interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  createdBy: string
  createdAt: Date
}

export interface Player {
  id: string
  name: string
  color: 'black' | 'white' | null
  isHost: boolean
  lastSeen?: Date
}
