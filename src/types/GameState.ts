export enum GameScreen {
  MENU = 'menu',
  GAME = 'game',
}

export interface GameState {
  currentScreen: GameScreen
  isOfflineMode: boolean
}
