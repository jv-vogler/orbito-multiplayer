import { useState, useEffect, useCallback } from 'react'
import { BOARD_SIZE, MAX_ROTATION_ATTEMPTS } from '../constants/game'
import {
  getCellPosition,
  getNextCell,
  areCellsAdjacent,
  generateId,
  checkWinners,
} from '../utils/gameUtils'
import type { Marble, Player, TurnStep, Winner, Position } from '../types/game'

export function useOfflineGameLogic() {
  const [marbles, setMarbles] = useState<Marble[]>([])
  const [animating, setAnimating] = useState(false)
  const [currentTurnColor, setCurrentTurnColor] = useState<Player | null>('black')
  const [turnStep, setTurnStep] = useState<TurnStep>(1)
  const [selectedEnemyMarbleId, setSelectedEnemyMarbleId] = useState<string | null>(null)
  const [marblePositions, setMarblePositions] = useState<{ [id: string]: Position }>({})
  const [winner, setWinner] = useState<Winner>(null)
  const [rotationAttempts, setRotationAttempts] = useState(0)

  console.log({ currentTurnColor })

  const canMoveEnemyMarble = useCallback(() => {
    const enemyMarbles = marbles.filter((m) => m.player !== currentTurnColor)
    if (enemyMarbles.length === 0) return false
    for (const m of enemyMarbles) {
      for (const delta of [-1, 1, -BOARD_SIZE, BOARD_SIZE]) {
        const adjCell = m.cell + delta
        if (
          adjCell >= 0 &&
          adjCell < BOARD_SIZE * BOARD_SIZE &&
          areCellsAdjacent(m.cell, adjCell) &&
          !marbles.find((mar) => mar.cell === adjCell)
        ) {
          return true
        }
      }
    }
    return false
  }, [marbles, currentTurnColor])

  const updateGameState = useCallback(
    (newMarbles: Marble[]) => {
      const winners = checkWinners(newMarbles)
      if (winners.black && winners.white) {
        setWinner('draw')
      } else if (winners.black) {
        setWinner('black')
      } else if (winners.white) {
        setWinner('white')
      } else if (newMarbles.length === BOARD_SIZE * BOARD_SIZE) {
        if (rotationAttempts >= MAX_ROTATION_ATTEMPTS) {
          setWinner('draw')
        }
      }
    },
    [rotationAttempts]
  )

  function handleCellClick(
    cell: number,
    callback?: () => void
  ): Promise<{
    marbles: Marble[]
    currentTurnColor: Player | null
    turnStep: TurnStep
    winner: Winner
    rotationAttempts: number
  } | null> {
    return new Promise((resolve) => {
      if (currentTurnColor === null) {
        resolve(null)
        return
      }

      if (animating || winner) {
        resolve(null)
        callback?.()
        return
      }

      if (turnStep === 1) {
        if (!selectedEnemyMarbleId) {
          const marble = marbles.find((m) => m.cell === cell && m.player !== currentTurnColor)
          if (marble) {
            setSelectedEnemyMarbleId(marble.id)
            resolve(null)
            callback?.()
            return
          }
          if (!marbles.find((m) => m.cell === cell)) {
            const id = generateId()
            const newMarbles = [...marbles, { id, cell, player: currentTurnColor }]
            setMarbles(newMarbles)
            setMarblePositions((pos) => ({ ...pos, [id]: getCellPosition(cell) }))
            updateGameState(newMarbles)
            setTurnStep(3)

            const newState = {
              marbles: newMarbles,
              currentTurnColor,
              turnStep: 3 as TurnStep,
              winner,
              rotationAttempts,
            }
            resolve(newState)
            callback?.()
            return
          }
        } else {
          if (
            !marbles.find((m) => m.cell === cell) &&
            areCellsAdjacent(cell, marbles.find((m) => m.id === selectedEnemyMarbleId)!.cell)
          ) {
            const newMarbles = marbles.map((m) =>
              m.id === selectedEnemyMarbleId ? { ...m, cell } : m
            )
            setMarbles(newMarbles)
            setMarblePositions((pos) => ({
              ...pos,
              [selectedEnemyMarbleId]: getCellPosition(cell),
            }))
            setSelectedEnemyMarbleId(null)
            updateGameState(newMarbles)
            setTurnStep(2)

            const newState = {
              marbles: newMarbles,
              currentTurnColor,
              turnStep: 2 as TurnStep,
              winner,
              rotationAttempts,
            }
            resolve(newState)
            callback?.()
            return
          } else {
            setSelectedEnemyMarbleId(null)
          }
        }
        resolve(null)
        callback?.()
        return
      }

      if (turnStep === 2) {
        if (marbles.find((m) => m.cell === cell)) {
          resolve(null)
          callback?.()
          return
        }
        const id = generateId()
        const newMarbles = [...marbles, { id, cell, player: currentTurnColor }]
        setMarbles(newMarbles)
        setMarblePositions((pos) => ({ ...pos, [id]: getCellPosition(cell) }))
        updateGameState(newMarbles)
        setTurnStep(3)

        const newState = {
          marbles: newMarbles,
          currentTurnColor,
          turnStep: 3 as TurnStep,
          winner,
          rotationAttempts,
        }
        resolve(newState)
        callback?.()
        return
      }

      resolve(null)
      callback?.()
    })
  }

  const animateRotation = useCallback(
    (callback?: () => void): Promise<void> => {
      return new Promise((resolve) => {
        if (animating || turnStep !== 3 || winner) {
          resolve()
          callback?.()
          return
        }

        setAnimating(true)

        const newPositions: typeof marblePositions = {}
        marbles.forEach(({ id, cell }) => {
          const nextCell = getNextCell(cell)
          newPositions[id] = getCellPosition(nextCell)
        })
        setMarblePositions(newPositions)

        setTimeout(() => {
          const newMarbles = marbles.map(({ id, cell, player }) => ({
            id,
            cell: getNextCell(cell),
            player,
          }))
          setMarbles(newMarbles)
          setAnimating(false)
          setSelectedEnemyMarbleId(null)

          updateGameState(newMarbles)

          const winners = checkWinners(newMarbles)
          const hasWinner = winners.black || winners.white

          if (hasWinner || (winners.black && winners.white)) {
            resolve()
            callback?.()
            return
          }

          if (newMarbles.length === BOARD_SIZE * BOARD_SIZE) {
            setRotationAttempts((ra) => ra + 1)
          } else {
            setRotationAttempts(0)
            setCurrentTurnColor((p) => (p === 'black' ? 'white' : 'black'))
            setTurnStep(1)
          }

          resolve()
          callback?.()
        }, 400)
      })
    },
    [animating, turnStep, winner, marbles, updateGameState]
  )

  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        animateRotation()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [animateRotation])

  useEffect(() => {
    if (turnStep === 1 && (marbles.length === 0 || !canMoveEnemyMarble())) {
      setTurnStep(2)
    }
  }, [turnStep, marbles, currentTurnColor, canMoveEnemyMarble])

  const setGameState = useCallback(
    (newState: {
      marbles?: Marble[]
      currentPlayer?: Player
      turnStep?: TurnStep
      selectedEnemyMarbleId?: string | null
      winner?: Winner
      rotationAttempts?: number
      animating?: boolean
    }) => {
      if (newState.marbles !== undefined) setMarbles(newState.marbles)
      if (newState.currentPlayer !== undefined) setCurrentTurnColor(newState.currentPlayer)
      if (newState.turnStep !== undefined) setTurnStep(newState.turnStep)
      if (newState.selectedEnemyMarbleId !== undefined)
        setSelectedEnemyMarbleId(newState.selectedEnemyMarbleId)
      if (newState.winner !== undefined) setWinner(newState.winner)
      if (newState.rotationAttempts !== undefined) setRotationAttempts(newState.rotationAttempts)
      if (newState.animating !== undefined) setAnimating(newState.animating)
    },
    []
  )

  const resetGame = () => {
    setMarbles([])
    setCurrentTurnColor('black')
    setTurnStep(1)
    setSelectedEnemyMarbleId(null)
    setMarblePositions({})
    setWinner(null)
    setRotationAttempts(0)
    setAnimating(false)
  }

  return {
    marbles,
    animating,
    currentTurnColor,
    turnStep,
    selectedEnemyMarbleId,
    marblePositions,
    winner,
    rotationAttempts,
    handleCellClick,
    animateRotation,
    resetGame,
    setGameState,
    setCurrentTurnColor,
  }
}
