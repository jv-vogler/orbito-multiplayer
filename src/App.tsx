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

export default function OrbitoFixedMarbles() {
  const [marbles, setMarbles] = useState<{ id: string; cell: number; player: Player }[]>([])
  const [animating, setAnimating] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black')

  // Turn step: 1 = move enemy marble (optional), 2 = place marble, 3 = rotate board
  const [turnStep, setTurnStep] = useState<1 | 2 | 3>(1)
  // For step 1: selected enemy marble to move
  const [selectedEnemyMarbleId, setSelectedEnemyMarbleId] = useState<string | null>(null)

  const [marblePositions, setMarblePositions] = useState<{
    [id: string]: { x: number; y: number }
  }>({})

  // Helpers
  function areCellsAdjacent(c1: number, c2: number) {
    const r1 = Math.floor(c1 / BOARD_SIZE)
    const c1Col = c1 % BOARD_SIZE
    const r2 = Math.floor(c2 / BOARD_SIZE)
    const c2Col = c2 % BOARD_SIZE
    return (
      (r1 === r2 && Math.abs(c1Col - c2Col) === 1) || (c1Col === c2Col && Math.abs(r1 - r2) === 1)
    )
  }

  // Can current player move any enemy marble? Returns boolean
  function canMoveEnemyMarble() {
    // Enemy marbles
    const enemyMarbles = marbles.filter((m) => m.player !== currentPlayer)
    if (enemyMarbles.length === 0) return false
    for (const m of enemyMarbles) {
      // Check adjacent cells
      for (const delta of [-1, 1, -BOARD_SIZE, BOARD_SIZE]) {
        const adjCell = m.cell + delta
        // Check bounds & adjacency (no wrap around)
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

  // Automatically advance step 1 if no moves possible or first turn (empty board)
  if (turnStep === 1 && (marbles.length === 0 || !canMoveEnemyMarble())) {
    setTurnStep(2)
  }

  function handleCellClick(cell: number) {
    if (animating) return

    if (turnStep === 1) {
      // Move enemy marble step
      if (!selectedEnemyMarbleId) {
        // Select enemy marble only
        const marble = marbles.find((m) => m.cell === cell && m.player !== currentPlayer)
        if (marble) setSelectedEnemyMarbleId(marble.id)
      } else {
        // Move selected enemy marble to adjacent empty cell
        if (
          !marbles.find((m) => m.cell === cell) &&
          areCellsAdjacent(cell, marbles.find((m) => m.id === selectedEnemyMarbleId)!.cell)
        ) {
          setMarbles((ms) => ms.map((m) => (m.id === selectedEnemyMarbleId ? { ...m, cell } : m)))
          setMarblePositions((pos) => ({
            ...pos,
            [selectedEnemyMarbleId]: getCellPosition(cell),
          }))
          setSelectedEnemyMarbleId(null)
          setTurnStep(2) // proceed to place marble
        } else {
          // Invalid move, deselect
          setSelectedEnemyMarbleId(null)
        }
      }
      return
    }

    if (turnStep === 2) {
      // Place marble step
      if (marbles.find((m) => m.cell === cell)) return
      const id = generateId()
      setMarbles((ms) => [...ms, { id, cell, player: currentPlayer }])
      setMarblePositions((pos) => ({ ...pos, [id]: getCellPosition(cell) }))

      setTurnStep(3) // next step rotate
    }
  }

  function animateRotation() {
    if (animating || turnStep !== 3) return

    setAnimating(true)

    const newPositions: typeof marblePositions = {}
    marbles.forEach(({ id, cell }) => {
      const nextCell = getNextCell(cell)
      newPositions[id] = getCellPosition(nextCell)
    })
    setMarblePositions(newPositions)

    setTimeout(() => {
      setMarbles((ms) =>
        ms.map(({ id, cell, player }) => ({ id, cell: getNextCell(cell), player }))
      )
      setAnimating(false)
      setTurnStep(1)
      setSelectedEnemyMarbleId(null)
      setCurrentPlayer((p) => (p === 'black' ? 'white' : 'black'))
    }, 400)
  }

  const stepTextMap = {
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
              (turnStep === 1 && !isSelectedEnemy && hasMarble) ||
              (turnStep === 2 && hasMarble)
                ? 'default'
                : 'pointer',
            outline: isSelectedEnemy ? '3px solid yellow' : undefined,
          }

          // When step 1 & selected enemy, allow clicks on adjacent empty cells
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
      <div style={{ marginBottom: 20, fontWeight: 'bold' }}>{stepTextMap[turnStep]}</div>
      {turnStep === 3 && (
        <button onClick={animateRotation} disabled={animating}>
          Rotate Marbles {animating ? '(Animating...)' : ''}
        </button>
      )}
    </div>
  )
}
