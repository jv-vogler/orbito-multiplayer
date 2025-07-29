import GameBoard from './components/GameBoard'
import { GameContainer } from './components/GameContainer'
import GameInfo from './components/GameInfo'
import { MainMenu } from './components/MainMenu'
// import { CreateRoom } from './components/CreateRoom'
// import { JoinRoom } from './components/JoinRoom'
// import { RoomLobby } from './components/RoomLobby'
import { useGameLogic } from './hooks/useGameLogic'
// import { useOnlineGame } from './hooks/useOnlineGame'
import { useGameState } from './hooks/useGameState'
// import { createRoom, createJoiningPlayer } from './utils/roomUtils'
import styles from './styles/Game.module.css'
import { GameScreen } from './types/GameState'

export default function OrbitoFixedMarbles() {
  const {
    gameState,
    // currentRoom,
    // currentPlayer,
    navigateToScreen,
    setOfflineMode,
    // setRoomData,
    // clearRoomData,
  } = useGameState()

  // Use different hooks based on game mode
  const offlineGame = useGameLogic()
  // const onlineGame = useOnlineGame() // TODO: Pass gameId when available

  // Select the appropriate game instance
  const game = gameState.isOfflineMode ? offlineGame : offlineGame // TODO: use onlineGame when ready

  const handleNavigateToGame = (isOffline: boolean) => {
    setOfflineMode(isOffline)
    game.resetGame()
    navigateToScreen(GameScreen.GAME)
  }

  // TODO: Uncomment when components are created
  // const handleCreateRoom = (roomName: string, playerName: string) => {
  //   const { room, player } = createRoom(roomName, playerName)
  //   setRoomData(room, player)
  //   setOfflineMode(false)
  //   navigateToScreen(GameScreen.ROOM_LOBBY)
  // }

  // const handleJoinRoom = (roomId: string, playerName: string) => {
  //   const player = createJoiningPlayer(playerName)
  //   console.log(`Attempting to join room: ${roomId} as ${playerName}`)
  //   alert('Room joining will be implemented with Firestore integration')
  //   navigateToScreen(GameScreen.MENU)
  // }

  // Menu Screen
  if (gameState.currentScreen === GameScreen.MENU) {
    return (
      <MainMenu
        onNavigate={(screen, isOffline = true) => {
          if (screen === GameScreen.GAME) {
            handleNavigateToGame(isOffline)
          } else {
            // TODO: Handle room navigation when components are ready
            alert('Room features coming soon!')
            navigateToScreen(GameScreen.MENU)
          }
        }}
      />
    )
  }

  // TODO: Add room screens when components are created
  // Create Room Screen
  // if (gameState.currentScreen === GameScreen.CREATE_ROOM) {
  //   return <CreateRoom onNavigate={navigateToScreen} onCreateRoom={handleCreateRoom} />
  // }

  // Game Screen
  return (
    <GameContainer onNavigate={navigateToScreen}>
      <div className={styles.container}>
        {game.winner && (
          <div
            className={`${styles.winner} ${
              styles[
                `winner${
                  game.winner === 'draw' ? 'Draw' : game.winner === 'black' ? 'Black' : 'White'
                }`
              ]
            }`}
          >
            {game.winner === 'draw'
              ? "It's a draw!"
              : `${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins!`}
          </div>
        )}

        <div className={styles.gameContent}>
          <GameBoard
            marbles={game.marbles}
            marblePositions={game.marblePositions}
            turnStep={game.turnStep}
            selectedEnemyMarbleId={game.selectedEnemyMarbleId}
            animating={game.animating}
            winner={game.winner}
            rotationAttempts={game.rotationAttempts}
            onCellClick={game.handleCellClick}
            onRotate={game.animateRotation}
          />

          <GameInfo
            currentPlayer={game.currentPlayer}
            turnStep={game.turnStep}
            winner={game.winner}
            rotationAttempts={game.rotationAttempts}
            marbleCount={game.marbles.length}
          />
        </div>
      </div>
    </GameContainer>
  )
}
