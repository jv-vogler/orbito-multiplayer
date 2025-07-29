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

export function useGameLogic() {
  const [marbles, setMarbles] = useState<Marble[]>([])
  const [animating, setAnimating] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black')
  const [turnStep, setTurnStep] = useState<TurnStep>(1)
  const [selectedEnemyMarbleId, setSelectedEnemyMarbleId] = useState<string | null>(null)
  const [marblePositions, setMarblePositions] = useState<{ [id: string]: Position }>({})
  const [winner, setWinner] = useState<Winner>(null)
  const [rotationAttempts, setRotationAttempts] = useState(0)

  const canMoveEnemyMarble = useCallback(() => {
    const enemyMarbles = marbles.filter((m) => m.player !== currentPlayer)
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
  }, [marbles, currentPlayer])

  function updateGameState(newMarbles: Marble[]) {
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
  }

  function handleCellClick(cell: number) {
    if (animating || winner) return

    if (turnStep === 1) {
      if (!selectedEnemyMarbleId) {
        const marble = marbles.find((m) => m.cell === cell && m.player !== currentPlayer)
        if (marble) {
          setSelectedEnemyMarbleId(marble.id)
          return
        }
        if (!marbles.find((m) => m.cell === cell)) {
          const id = generateId()
          const newMarbles = [...marbles, { id, cell, player: currentPlayer }]
          setMarbles(newMarbles)
          setMarblePositions((pos) => ({ ...pos, [id]: getCellPosition(cell) }))
          updateGameState(newMarbles)
          setTurnStep(3)
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
        } else {
          setSelectedEnemyMarbleId(null)
        }
      }
      return
    }

    if (turnStep === 2) {
      if (marbles.find((m) => m.cell === cell)) return
      const id = generateId()
      const newMarbles = [...marbles, { id, cell, player: currentPlayer }]
      setMarbles(newMarbles)
      setMarblePositions((pos) => ({ ...pos, [id]: getCellPosition(cell) }))
      updateGameState(newMarbles)
      setTurnStep(3)
      return
    }
  }

  function animateRotation() {
    if (animating || turnStep !== 3 || winner) return

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

      if (hasWinner || (winners.black && winners.white)) return

      if (newMarbles.length === BOARD_SIZE * BOARD_SIZE) {
        setRotationAttempts((ra) => ra + 1)
      } else {
        setRotationAttempts(0)
        setCurrentPlayer((p) => (p === 'black' ? 'white' : 'black'))
        setTurnStep(1)
      }
    }, 400)
  }

  // Auto-skip step 1 if no enemy marbles can be moved
  useEffect(() => {
    if (turnStep === 1 && (marbles.length === 0 || !canMoveEnemyMarble())) {
      setTurnStep(2)
    }
  }, [turnStep, marbles, currentPlayer, canMoveEnemyMarble])

  return {
    marbles,
    animating,
    currentPlayer,
    turnStep,
    selectedEnemyMarbleId,
    marblePositions,
    winner,
    rotationAttempts,
    handleCellClick,
    animateRotation,
  }
}
