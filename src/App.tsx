import { useState } from 'react'

const BOARD_SIZE = 4
const CELL_SIZE = 60

const outerOrbit = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4]
const innerOrbit = [5, 6, 10, 9]

function getCellPosition(cellIndex: number) {
  const row = Math.floor(cellIndex / BOARD_SIZE)
  const col = cellIndex % BOARD_SIZE
  return { x: col * CELL_SIZE, y: row * CELL_SIZE }
}

function getNextCell(cell: number) {
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

function generateId() {
  return Math.random().toString(36).slice(2)
}

type Player = 'black' | 'white'
type TurnStep = 1 | 2 | 3

export default function OrbitoFixedMarbles() {
  const [marbles, setMarbles] = useState<{ id: string; cell: number; player: Player }[]>([])
  const [animating, setAnimating] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black')

  const [turnStep, setTurnStep] = useState<TurnStep>(1)
  const [selectedEnemyMarbleId, setSelectedEnemyMarbleId] = useState<string | null>(null)
  const [marblePositions, setMarblePositions] = useState<{
    [id: string]: { x: number; y: number }
  }>({})

  // New states for winner and rotation attempts
  const [winner, setWinner] = useState<Player | 'draw' | null>(null)
  const [rotationAttempts, setRotationAttempts] = useState(0)

  function areCellsAdjacent(c1: number, c2: number) {
    const r1 = Math.floor(c1 / BOARD_SIZE)
    const c1Col = c1 % BOARD_SIZE
    const r2 = Math.floor(c2 / BOARD_SIZE)
    const c2Col = c2 % BOARD_SIZE
    return (
      (r1 === r2 && Math.abs(c1Col - c2Col) === 1) || (c1Col === c2Col && Math.abs(r1 - r2) === 1)
    )
  }

  function canMoveEnemyMarble() {
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
  }

  if (turnStep === 1 && (marbles.length === 0 || !canMoveEnemyMarble())) {
    setTurnStep(2)
  }

  // New function: checks both players for 4 in a row
  function checkWinners(marblesArr: { cell: number; player: Player }[]): {
    black: boolean
    white: boolean
  } {
    const board = Array(BOARD_SIZE * BOARD_SIZE).fill(null) as (Player | null)[]
    marblesArr.forEach(({ cell, player }) => {
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

  // New function: update game winner/draw state
  function updateGameState(newMarbles: { id: string; cell: number; player: Player }[]) {
    const winners = checkWinners(newMarbles)
    if (winners.black && winners.white) {
      setWinner('draw')
    } else if (winners.black) {
      setWinner('black')
    } else if (winners.white) {
      setWinner('white')
    } else if (newMarbles.length === BOARD_SIZE * BOARD_SIZE) {
      // Board full but no winner yet
      if (rotationAttempts >= 5) {
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
        // Clicking empty cell skips step 1 AND places marble in that cell immediately
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
        // Move selected enemy marble to adjacent empty cell
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
          setTurnStep(2) // next place marble normally
        } else {
          setSelectedEnemyMarbleId(null) // invalid move, deselect
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

      // Check winners after update
      const winners = checkWinners(newMarbles)
      const hasWinner = winners.black || winners.white

      // If game ended, don't continue
      if (hasWinner || (winners.black && winners.white)) return

      // If board full and no winner, increment rotation attempts
      if (newMarbles.length === BOARD_SIZE * BOARD_SIZE) {
        setRotationAttempts((ra) => ra + 1)
      } else {
        setRotationAttempts(0)
        setCurrentPlayer((p) => (p === 'black' ? 'white' : 'black'))
        setTurnStep(1)
      }
    }, 400)
  }

  const stepTextMap: Record<TurnStep, string> = {
    1: 'Step 1 (optional): Move ONE enemy marble to an adjacent empty cell.',
    2: 'Step 2: Place your marble on an empty cell.',
    3: 'Step 3: Rotate the board.',
  }

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          position: 'relative',
          width: BOARD_SIZE * CELL_SIZE,
          height: BOARD_SIZE * CELL_SIZE,
          border: '1px solid black',
          marginBottom: 20,
          userSelect: 'none',
          backgroundColor: 'red',
        }}
      >
        {[...Array(BOARD_SIZE * BOARD_SIZE)].map((_, i) => {
          const { x, y } = getCellPosition(i)
          const hasMarble = marbles.some((m) => m.cell === i)
          const marble = marbles.find((m) => m.cell === i)
          const isSelectedEnemy = selectedEnemyMarbleId === marble?.id

          let cellStyle = {
            position: 'absolute' as const,
            left: x,
            top: y,
            width: CELL_SIZE,
            height: CELL_SIZE,
            boxSizing: 'border-box' as const,
            border: '1px solid #aaa',
            backgroundColor: '#a94134',
            cursor:
              animating ||
              winner ||
              (turnStep === 1 && !isSelectedEnemy && hasMarble) ||
              (turnStep === 2 && hasMarble)
                ? 'default'
                : 'pointer',
            boxShadow: isSelectedEnemy ? '0 0 0 3px yellow' : undefined,
          }

          if (turnStep === 1 && selectedEnemyMarbleId && !hasMarble) {
            const selectedMarble = marbles.find((m) => m.id === selectedEnemyMarbleId)!
            if (areCellsAdjacent(i, selectedMarble.cell)) {
              cellStyle = { ...cellStyle, cursor: 'pointer', backgroundColor: '#b55347' }
            }
          }

          return <div key={i} onClick={() => handleCellClick(i)} style={cellStyle} />
        })}

        {marbles.map(({ id, player }) => {
          const pos = marblePositions[id] ?? getCellPosition(0)
          const isSelectedEnemy = selectedEnemyMarbleId === id
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                left: pos.x + 10,
                top: pos.y + 10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: player === 'black' ? '#000' : '#fff',
                border: isSelectedEnemy ? '3px solid yellow' : '2px solid #333',
                transition: animating ? 'left 0.4s ease, top 0.4s ease' : 'none',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            />
          )
        })}
      </div>

      <div style={{ marginBottom: 10, fontWeight: 'bold' }}>
        Current Player: {currentPlayer === 'black' ? 'Black' : 'White'}
      </div>

      {/* Show all steps with highlight */}
      <div style={{ marginBottom: 20, fontWeight: 'bold' }}>
        {([1, 2, 3] as const).map((step) => (
          <div
            key={step}
            style={{
              color: turnStep === step ? 'yellow' : 'white',
              fontWeight: turnStep === step ? 'bold' : 'normal',
              marginBottom: 4,
              textShadow: turnStep === step ? '0 0 5px yellow' : undefined,
            }}
          >
            {stepTextMap[step]}
          </div>
        ))}
      </div>

      {/* Show winner or rotation attempts left */}
      {winner ? (
        <div
          style={{
            fontWeight: 'bold',
            fontSize: 20,
            marginBottom: 20,
            color: winner === 'draw' ? 'orange' : winner,
          }}
        >
          {winner === 'draw'
            ? "It's a draw!"
            : `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`}
        </div>
      ) : marbles.length === BOARD_SIZE * BOARD_SIZE ? (
        <div style={{ fontWeight: 'bold', marginBottom: 10 }}>
          Rotation attempts left: {5 - rotationAttempts}
        </div>
      ) : null}

      <button
        onClick={animateRotation}
        disabled={animating || turnStep !== 3 || !!winner || rotationAttempts >= 5}
        style={{
          visibility: turnStep === 3 && !winner && rotationAttempts < 5 ? 'visible' : 'hidden',
          height: '40px',
          marginTop: '10px',
        }}
      >
        Rotate Marbles {animating ? '(Animating...)' : ''}
      </button>
    </div>
  )
}
