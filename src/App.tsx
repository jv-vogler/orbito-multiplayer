import GameBoard from './components/GameBoard'
import { GameContainer } from './components/GameContainer'
import GameInfo from './components/GameInfo'
import { MainMenu } from './components/MainMenu'
import { CreateRoom } from './components/CreateRoom'
import { JoinRoom } from './components/JoinRoom'
import { RoomLobby } from './components/RoomLobby'
import { useOfflineGameLogic } from './hooks/useOfflineGameLogic'
import { useOnlineGameLogic } from './hooks/useOnlineGameLogic'
import { useGameState } from './hooks/useGameState'
import { createRoom, joinRoom } from './services/roomService'
import styles from './styles/Game.module.css'
import { GameScreen } from './types/GameState'
import { useEffect } from 'react'

export default function OrbitoFixedMarbles() {
  const {
    gameState,
    currentRoom,
    currentPlayer,
    navigateToScreen,
    setOfflineMode,
    setRoomData,
    clearRoomData,
  } = useGameState()

  const offlineGame = useOfflineGameLogic()
  const onlineGame = useOnlineGameLogic(currentRoom?.id, currentPlayer?.id, {
    isGameScreen: gameState.currentScreen === GameScreen.GAME,
    player: currentPlayer,
    onPlayerUpdate: (updatedPlayer) => {
      if (currentRoom) {
        const updatedRoom = {
          ...currentRoom,
          players: currentRoom.players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
        }
        setRoomData(updatedRoom, updatedPlayer)
      }
    },
  })

  const game = gameState.isOfflineMode ? offlineGame : onlineGame

  useEffect(() => {
    if (currentPlayer && !gameState.isOfflineMode) {
      onlineGame.setHostStatus(currentPlayer.isHost)
    }
  }, [currentPlayer, gameState.isOfflineMode, onlineGame])

  const handleNavigateToGame = (isOffline: boolean) => {
    setOfflineMode(isOffline)
    game.resetGame()
    navigateToScreen(GameScreen.GAME)
  }

  const handleCreateRoom = async (roomName: string, playerName: string) => {
    try {
      const { room, player } = await createRoom(roomName, playerName)
      setRoomData(room, player)
      setOfflineMode(false)
      navigateToScreen(GameScreen.ROOM_LOBBY)
    } catch (error) {
      console.error('Failed to create room:', error)
      throw error
    }
  }

  const handleJoinRoom = async (roomId: string, playerName: string) => {
    try {
      const { room, player } = await joinRoom(roomId, playerName)
      setRoomData(room, player)
      setOfflineMode(false)
      navigateToScreen(GameScreen.ROOM_LOBBY)
    } catch (error) {
      console.error('Failed to join room:', error)
      throw error
    }
  }

  const handleGameStart = () => {
    if (gameState.isOfflineMode) {
      offlineGame.resetGame()
    } else {
      if (currentPlayer?.isHost) {
        onlineGame.initializeOnlineGame()
      }
    }
    navigateToScreen(GameScreen.GAME)
  }

  const handleLeaveRoom = () => {
    clearRoomData()
    setOfflineMode(true)
    navigateToScreen(GameScreen.MENU)
  }

  /**
   * Menu Screen
   */
  if (gameState.currentScreen === GameScreen.MENU) {
    return (
      <MainMenu
        onNavigate={(screen, isOffline = true) => {
          if (screen === GameScreen.GAME) {
            handleNavigateToGame(isOffline)
          } else if (screen === GameScreen.CREATE_ROOM) {
            navigateToScreen(GameScreen.CREATE_ROOM)
          } else if (screen === GameScreen.JOIN_ROOM) {
            navigateToScreen(GameScreen.JOIN_ROOM)
          } else {
            navigateToScreen(screen)
          }
        }}
      />
    )
  }

  /**
   * Create Room Screen
   */
  if (gameState.currentScreen === GameScreen.CREATE_ROOM) {
    return <CreateRoom onNavigate={navigateToScreen} onCreateRoom={handleCreateRoom} />
  }

  /**
   * Join Room Screen
   */
  if (gameState.currentScreen === GameScreen.JOIN_ROOM) {
    return <JoinRoom onNavigate={navigateToScreen} onJoinRoom={handleJoinRoom} />
  }

  /**
   * Room Lobby Screen
   */
  if (gameState.currentScreen === GameScreen.ROOM_LOBBY && currentRoom && currentPlayer) {
    return (
      <RoomLobby
        room={currentRoom}
        currentPlayer={currentPlayer}
        onNavigate={navigateToScreen}
        onGameStart={handleGameStart}
        onLeaveRoom={handleLeaveRoom}
      />
    )
  }

  /**
   * Game Screen
   */
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
            currentPlayer={game.currentTurnColor}
            turnStep={game.turnStep}
            winner={game.winner}
            rotationAttempts={game.rotationAttempts}
            marbleCount={game.marbles.length}
            isOnline={!gameState.isOfflineMode}
          />
        </div>
      </div>
    </GameContainer>
  )
}
