import { useState } from 'react'

const BOARD_SIZE = 4
const CELL_SIZE = 60

// Define outer and inner orbits separately
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

  // Cell is not on any orbit, no move
  return cell
}

// Generate unique IDs for marbles
function generateId() {
  return Math.random().toString(36).slice(2)
}

export default function OrbitoFixedMarbles() {
  // Each marble has an id and cell position
  const [marbles, setMarbles] = useState<{ id: string; cell: number }[]>([])
  const [animating, setAnimating] = useState(false)

  const [marblePositions, setMarblePositions] = useState<{
    [id: string]: { x: number; y: number }
  }>({})

  function handleCellClick(cell: number) {
    if (animating) return
    if (marbles.find((m) => m.cell === cell)) return

    const id = generateId()
    setMarbles((ms) => [...ms, { id, cell }])
    setMarblePositions((pos) => ({ ...pos, [id]: getCellPosition(cell) }))
  }

  function animateRotation() {
    if (animating || marbles.length === 0) return

    setAnimating(true)

    const newPositions: typeof marblePositions = {}
    marbles.forEach(({ id, cell }) => {
      const nextCell = getNextCell(cell)
      newPositions[id] = getCellPosition(nextCell)
    })
    setMarblePositions(newPositions)

    setTimeout(() => {
      setMarbles((ms) => ms.map(({ id, cell }) => ({ id, cell: getNextCell(cell) })))
      setAnimating(false)
    }, 400)
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
        }}
      >
        {/* Board cells */}
        {[...Array(BOARD_SIZE * BOARD_SIZE)].map((_, i) => {
          const { x, y } = getCellPosition(i)
          const hasMarble = marbles.some((m) => m.cell === i)
          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: CELL_SIZE,
                height: CELL_SIZE,
                boxSizing: 'border-box',
                border: '1px solid #ddd',
                backgroundColor: hasMarble ? '#f0f0f0' : '#fff',
                cursor: animating || hasMarble ? 'default' : 'pointer',
              }}
            />
          )
        })}

        {/* Marbles */}
        {marbles.map(({ id }) => {
          const pos = marblePositions[id] ?? getCellPosition(0)
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'red',
                transition: animating ? 'left 0.4s ease, top 0.4s ease' : 'none',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            />
          )
        })}
      </div>
      <button onClick={animateRotation} disabled={animating || marbles.length === 0}>
        Rotate Marbles {animating ? '(Animating...)' : ''}
      </button>
    </div>
  )
}
