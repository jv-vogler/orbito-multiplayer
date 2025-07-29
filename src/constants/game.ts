export const BOARD_SIZE = 4
export const CELL_SIZE = 60
export const MAX_ROTATION_ATTEMPTS = 5

export const outerOrbit = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4]
export const innerOrbit = [5, 6, 10, 9]

export const stepTextMap: Record<1 | 2 | 3, string> = {
  1: 'Step 1 (optional): Move ONE enemy marble to an adjacent empty cell.',
  2: 'Step 2: Place your marble on an empty cell.',
  3: 'Step 3: Rotate the board.',
}
