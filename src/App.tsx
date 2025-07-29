import { useRef, useState } from 'react'

const BOARD_SIZE = 4 // 4x4 grid
const CELL_SIZE = 60 // pixels per cell

// Orbit cells by index in board grid
const orbitCells = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4]

// Calculate x, y positions from cell index:
function getCellPosition(cellIndex: number) {
  const row = Math.floor(cellIndex / BOARD_SIZE)
  const col = cellIndex % BOARD_SIZE
  return { x: col * CELL_SIZE, y: row * CELL_SIZE }
}

export default function AnimatedCircle() {
  const [posIndex, setPosIndex] = useState(0)
  const [animating, setAnimating] = useState(false)
  const posRef = useRef(posIndex)

  // Positions are derived dynamically from orbitCells
  const positions = orbitCells.map(getCellPosition)

  function moveNext() {
    if (animating) return

    setAnimating(true)
    setPosIndex(posRef.current)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextIndex = (posRef.current - 1 + positions.length) % positions.length
        setPosIndex(nextIndex)
        posRef.current = nextIndex
      })
    })

    setTimeout(() => {
      setAnimating(false)
    }, 400)
  }

  const pos = positions[posIndex]

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          position: 'relative',
          width: BOARD_SIZE * CELL_SIZE,
          height: BOARD_SIZE * CELL_SIZE,
          border: '1px solid black',
          marginBottom: 20,
          overflow: 'hidden',
        }}
      >
        {/* Grid background for visual reference */}
        {[...Array(BOARD_SIZE * BOARD_SIZE)].map((_, i) => {
          const { x, y } = getCellPosition(i)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: CELL_SIZE,
                height: CELL_SIZE,
                boxSizing: 'border-box',
                border: '1px solid #ddd',
              }}
            />
          )
        })}

        {/* Animated circle */}
        <div
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'red',
            left: pos.x,
            top: pos.y,
            transition: 'left 0.4s ease, top 0.4s ease',
          }}
        />
      </div>
      <button onClick={moveNext} disabled={animating}>
        Move Circle {animating ? '(Animating...)' : ''}
      </button>
    </div>
  )
}
