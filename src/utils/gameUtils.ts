import { BOARD_SIZE, CELL_SIZE, outerOrbit, innerOrbit } from '../constants/game'
import type { Player, Marble, Position } from '../types/game'

export function getCellPosition(cellIndex: number): Position {
  const row = Math.floor(cellIndex / BOARD_SIZE)
  const col = cellIndex % BOARD_SIZE
  return { x: col * CELL_SIZE, y: row * CELL_SIZE }
}

export function getNextCell(cell: number): number {
  const outerIdx = outerOrbit.indexOf(cell)
  if (outerIdx !== -1) {
    return outerOrbit[(outerIdx - 1 + outerOrbit.length) % outerOrbit.length]
  }

  const innerIdx = innerOrbit.indexOf(cell)
  if (innerIdx !== -1) {
    return innerOrbit[(innerIdx - 1 + innerOrbit.length) % innerOrbit.length]
  }

  return cell
}

export function areCellsAdjacent(c1: number, c2: number): boolean {
  const r1 = Math.floor(c1 / BOARD_SIZE)
  const c1Col = c1 % BOARD_SIZE
  const r2 = Math.floor(c2 / BOARD_SIZE)
  const c2Col = c2 % BOARD_SIZE
  return (
    (r1 === r2 && Math.abs(c1Col - c2Col) === 1) || (c1Col === c2Col && Math.abs(r1 - r2) === 1)
  )
}

export function generateId(): string {
  return Math.random().toString(36).slice(2)
}

export function checkWinners(marbles: Marble[]): { black: boolean; white: boolean } {
  const board = Array(BOARD_SIZE * BOARD_SIZE).fill(null) as (Player | null)[]
  marbles.forEach(({ cell, player }) => {
    board[cell] = player
  })

  const directions = [
    { dr: 0, dc: 1 }, // horizontal
    { dr: 1, dc: 0 }, // vertical
    { dr: 1, dc: 1 }, // diagonal down-right
    { dr: 1, dc: -1 }, // diagonal down-left
  ]

  function inBounds(r: number, c: number) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE
  }

  let blackWin = false
  let whiteWin = false

  for (let cell = 0; cell < board.length; cell++) {
    const player = board[cell]
    if (!player) continue
    const row = Math.floor(cell / BOARD_SIZE)
    const col = cell % BOARD_SIZE

    for (const { dr, dc } of directions) {
      let count = 1
      let r = row + dr
      let c = col + dc
      while (inBounds(r, c) && board[r * BOARD_SIZE + c] === player) {
        count++
        if (count >= 4) {
          if (player === 'black') blackWin = true
          else whiteWin = true
          break
        }
        r += dr
        c += dc
      }
      if (blackWin && whiteWin) break
    }
    if (blackWin && whiteWin) break
  }

  return { black: blackWin, white: whiteWin }
}
