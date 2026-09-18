// Generator labiryntu.
// Seed steruje nie tylko układem ścian, ale też charakterem labiryntu: sposobem drążenia,
// liczbą ślepych uliczek oraz położeniem startu i mety. Dzięki temu kolejne warianty karty
// to naprawdę różne zadania, a nie ten sam labirynt w innym układzie.

import { createSeededRandom } from './utils'

export interface MazeCell {
  /** Ściany pola w kolejności: góra, prawo, dół, lewo. */
  walls: [boolean, boolean, boolean, boolean]
}

export interface MazeEnd {
  col: number
  row: number
  /** Który bok pola jest otwarty na zewnątrz: 0 góra, 1 prawo, 2 dół, 3 lewo. */
  wall: number
}

export interface Maze {
  cols: number
  rows: number
  cells: MazeCell[][]
  start: MazeEnd
  finish: MazeEnd
  /** Najkrótsza droga od startu do mety - używana w kluczu odpowiedzi. */
  solution: { col: number; row: number }[]
}

/** Sposób drążenia korytarzy - każdy daje labirynt o innym charakterze. */
export type MazeCarver = 'random' | 'winding' | 'branching'

/** Ile ślepych uliczek zostaje w labiryncie. */
export type MazeDeadEnds = 'many' | 'few' | 'none'

/** Gdzie wypadają start i meta. */
export type MazeEnds = 'random' | 'corners' | 'edges'

export interface MazeOptions {
  cols: number
  rows: number
  carver: MazeCarver
  deadEnds: MazeDeadEnds
  ends: MazeEnds
  seed: number
}

/** Kierunki w kolejności zgodnej z indeksami ścian: góra, prawo, dół, lewo. */
const DIRECTIONS: { dCol: number; dRow: number; wall: number; opposite: number }[] = [
  { dCol: 0, dRow: -1, wall: 0, opposite: 2 },
  { dCol: 1, dRow: 0, wall: 1, opposite: 3 },
  { dCol: 0, dRow: 1, wall: 2, opposite: 0 },
  { dCol: -1, dRow: 0, wall: 3, opposite: 1 },
]

type Direction = (typeof DIRECTIONS)[number]

function makeCells(cols: number, rows: number): MazeCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
    })),
  )
}

/** Przebija ścianę między polem a jego sąsiadem - z obu stron naraz. */
function openWall(cells: MazeCell[][], col: number, row: number, direction: Direction) {
  cells[row][col].walls[direction.wall] = false
  cells[row + direction.dRow][col + direction.dCol].walls[direction.opposite] = false
}

/** Drążenie w głąb z nawrotami: długie, kręte korytarze i sporo ślepych uliczek. */
function carveWinding(cells: MazeCell[][], cols: number, rows: number, random: () => number) {
  const visited = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false))
  const startCol = Math.floor(random() * cols)
  const startRow = Math.floor(random() * rows)
  const stack = [{ col: startCol, row: startRow }]
  visited[startRow][startCol] = true

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const options = DIRECTIONS.filter(({ dCol, dRow }) => {
      const col = current.col + dCol
      const row = current.row + dRow
      return col >= 0 && col < cols && row >= 0 && row < rows && !visited[row][col]
    })

    if (options.length === 0) {
      stack.pop()
      continue
    }

    const pick = options[Math.floor(random() * options.length)]
    openWall(cells, current.col, current.row, pick)
    const col = current.col + pick.dCol
    const row = current.row + pick.dRow
    visited[row][col] = true
    stack.push({ col, row })
  }
}

/**
 * Drążenie metodą Prima: korytarze są krótsze i częściej się rozgałęziają,
 * więc labirynt wygląda zupełnie inaczej niż ten z drążenia w głąb.
 */
function carveBranching(cells: MazeCell[][], cols: number, rows: number, random: () => number) {
  const visited = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false))
  const frontier: { col: number; row: number; direction: Direction }[] = []

  const pushFrontier = (col: number, row: number) => {
    for (const direction of DIRECTIONS) {
      const nextCol = col + direction.dCol
      const nextRow = row + direction.dRow
      if (nextCol < 0 || nextCol >= cols || nextRow < 0 || nextRow >= rows) continue
      if (visited[nextRow][nextCol]) continue
      frontier.push({ col, row, direction })
    }
  }

  const startCol = Math.floor(random() * cols)
  const startRow = Math.floor(random() * rows)
  visited[startRow][startCol] = true
  pushFrontier(startCol, startRow)

  while (frontier.length > 0) {
    const index = Math.floor(random() * frontier.length)
    const { col, row, direction } = frontier[index]
    frontier.splice(index, 1)

    const nextCol = col + direction.dCol
    const nextRow = row + direction.dRow
    if (visited[nextRow][nextCol]) continue

    openWall(cells, col, row, direction)
    visited[nextRow][nextCol] = true
    pushFrontier(nextCol, nextRow)
  }
}

/**
 * Usuwa część ślepych uliczek, przebijając ścianę do sąsiada. Powstają pętle, więc labirynt
 * przestaje być drzewem - dlatego drogi szukamy przeszukiwaniem wszerz, które z wielu
 * możliwych tras znajdzie najkrótszą.
 */
function removeDeadEnds(
  cells: MazeCell[][],
  cols: number,
  rows: number,
  random: () => number,
  share: number,
) {
  if (share <= 0) return

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wallCount = cells[row][col].walls.filter(Boolean).length
      // Ślepa uliczka to pole z jednym tylko wyjściem.
      if (wallCount < 3) continue
      if (random() > share) continue

      const options = DIRECTIONS.filter(({ dCol, dRow, wall }) => {
        if (!cells[row][col].walls[wall]) return false
        const nextCol = col + dCol
        const nextRow = row + dRow
        return nextCol >= 0 && nextCol < cols && nextRow >= 0 && nextRow < rows
      })
      if (options.length === 0) continue
      openWall(cells, col, row, options[Math.floor(random() * options.length)])
    }
  }
}

/** Pola leżące przy danej krawędzi, razem z bokiem, który da się otworzyć na zewnątrz. */
function edgeCells(cols: number, rows: number, edge: number): MazeEnd[] {
  if (edge === 0) return Array.from({ length: cols }, (_, col) => ({ col, row: 0, wall: 0 }))
  if (edge === 1) return Array.from({ length: rows }, (_, row) => ({ col: cols - 1, row, wall: 1 }))
  if (edge === 2) return Array.from({ length: cols }, (_, col) => ({ col, row: rows - 1, wall: 2 }))
  return Array.from({ length: rows }, (_, row) => ({ col: 0, row, wall: 3 }))
}

/** Start i meta zawsze na przeciwległych krawędziach, żeby droga szła przez cały labirynt. */
function pickEnds(cols: number, rows: number, random: () => number, mode: MazeEnds): [MazeEnd, MazeEnd] {
  const effective = mode === 'random' ? (random() < 0.5 ? 'corners' : 'edges') : mode

  if (effective === 'corners') {
    const pairs: [MazeEnd, MazeEnd][] = [
      [
        { col: 0, row: 0, wall: 3 },
        { col: cols - 1, row: rows - 1, wall: 1 },
      ],
      [
        { col: cols - 1, row: 0, wall: 1 },
        { col: 0, row: rows - 1, wall: 3 },
      ],
      [
        { col: 0, row: rows - 1, wall: 3 },
        { col: cols - 1, row: 0, wall: 1 },
      ],
      [
        { col: cols - 1, row: rows - 1, wall: 1 },
        { col: 0, row: 0, wall: 3 },
      ],
    ]
    return pairs[Math.floor(random() * pairs.length)]
  }

  const startEdge = Math.floor(random() * 4)
  const startOptions = edgeCells(cols, rows, startEdge)
  const finishOptions = edgeCells(cols, rows, (startEdge + 2) % 4)
  return [
    startOptions[Math.floor(random() * startOptions.length)],
    finishOptions[Math.floor(random() * finishOptions.length)],
  ]
}

/**
 * Przeszukiwanie wszerz - znajduje najkrótszą drogę także wtedy, gdy po usunięciu
 * ślepych uliczek labirynt ma pętle i tras jest kilka.
 */
function solveMaze(cells: MazeCell[][], cols: number, rows: number, start: MazeEnd, finish: MazeEnd) {
  const key = (col: number, row: number) => `${col}:${row}`
  const cameFrom = new Map<string, string | null>([[key(start.col, start.row), null]])
  const queue: { col: number; row: number }[] = [{ col: start.col, row: start.row }]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.col === finish.col && current.row === finish.row) break

    for (const { dCol, dRow, wall } of DIRECTIONS) {
      if (cells[current.row][current.col].walls[wall]) continue
      const col = current.col + dCol
      const row = current.row + dRow
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue
      if (cameFrom.has(key(col, row))) continue
      cameFrom.set(key(col, row), key(current.col, current.row))
      queue.push({ col, row })
    }
  }

  const path: { col: number; row: number }[] = []
  let cursor: string | null | undefined = key(finish.col, finish.row)
  if (!cameFrom.has(cursor)) return path

  while (cursor) {
    const [col, row] = cursor.split(':').map(Number)
    path.push({ col, row })
    cursor = cameFrom.get(cursor) ?? null
  }
  return path.reverse()
}

/** Jaka część ślepych uliczek zostaje przebita. */
const DEAD_END_SHARE: Record<MazeDeadEnds, number> = { many: 0, few: 0.45, none: 1 }

export function generateMaze(options: MazeOptions): Maze {
  const { cols, rows, carver, deadEnds, ends, seed } = options
  const random = createSeededRandom(seed)
  const cells = makeCells(cols, rows)

  const effectiveCarver = carver === 'random' ? (random() < 0.5 ? 'winding' : 'branching') : carver
  if (effectiveCarver === 'winding') carveWinding(cells, cols, rows, random)
  else carveBranching(cells, cols, rows, random)

  removeDeadEnds(cells, cols, rows, random, DEAD_END_SHARE[deadEnds])

  // Losujemy kilka par start-meta i bierzemy tę z najdłuższą drogą. Bez tego zdarzały się
  // labirynty, w których meta leżała kilka pól od startu i zadanie było rozwiązane od razu.
  let start = { col: 0, row: 0, wall: 3 }
  let finish = { col: cols - 1, row: rows - 1, wall: 1 }
  let solution: { col: number; row: number }[] = []

  for (let attempt = 0; attempt < 6; attempt++) {
    const [candidateStart, candidateFinish] = pickEnds(cols, rows, random, ends)
    const path = solveMaze(cells, cols, rows, candidateStart, candidateFinish)
    if (path.length > solution.length) {
      start = candidateStart
      finish = candidateFinish
      solution = path
    }
  }

  // Wejście i wyjście to otwory w ścianie zewnętrznej.
  cells[start.row][start.col].walls[start.wall] = false
  cells[finish.row][finish.col].walls[finish.wall] = false

  return { cols, rows, cells, start, finish, solution }
}

/**
 * Poziomy trudności opisane liczbą pól w poziomie. Liczbę wierszy wyliczamy z proporcji
 * miejsca na kartce, żeby labirynt miał kwadratowe pola i wypełniał stronę w obu orientacjach.
 */
export const MAZE_LEVELS = [
  { value: 1, label: 'Bardzo łatwy', cols: 7 },
  { value: 2, label: 'Łatwy', cols: 10 },
  { value: 3, label: 'Średni', cols: 14 },
  { value: 4, label: 'Trudny', cols: 19 },
  { value: 5, label: 'Bardzo trudny', cols: 25 },
] as const

export function getMazeLevel(value: number | undefined) {
  return MAZE_LEVELS.find((level) => level.value === value) ?? MAZE_LEVELS[1]
}
