// Generator labiryntu: drążenie korytarzy metodą DFS z nawrotami (randomized depth-first search).
// Wynik to labirynt „doskonały" - między dowolnymi dwoma polami istnieje dokładnie jedna droga,
// więc rozwiązanie jest zawsze jednoznaczne i zawsze istnieje.
// Generowanie jest deterministyczne dla danego seeda, dzięki czemu podgląd nie zmienia się przy
// każdym renderze, a kolejne warianty karty dostają różne, powtarzalne labirynty.

import { createSeededRandom } from './utils'

export interface MazeCell {
  /** Ściany pola w kolejności: góra, prawo, dół, lewo. */
  walls: [boolean, boolean, boolean, boolean]
}

export interface Maze {
  cols: number
  rows: number
  cells: MazeCell[][]
  /** Droga od startu do mety jako kolejne pola - używana w kluczu odpowiedzi. */
  solution: { col: number; row: number }[]
}

/** Kierunki w kolejności zgodnej z indeksami ścian: góra, prawo, dół, lewo. */
const DIRECTIONS: { dCol: number; dRow: number; wall: number; opposite: number }[] = [
  { dCol: 0, dRow: -1, wall: 0, opposite: 2 },
  { dCol: 1, dRow: 0, wall: 1, opposite: 3 },
  { dCol: 0, dRow: 1, wall: 2, opposite: 0 },
  { dCol: -1, dRow: 0, wall: 3, opposite: 1 },
]

export function generateMaze(cols: number, rows: number, seed: number): Maze {
  const random = createSeededRandom(seed)
  const cells: MazeCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ walls: [true, true, true, true] as [boolean, boolean, boolean, boolean] })),
  )
  const visited = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false))

  // Drążenie korytarzy: idziemy losowo w głąb, a gdy utkniemy - cofamy się po stosie.
  const stack: { col: number; row: number }[] = [{ col: 0, row: 0 }]
  visited[0][0] = true

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
    const col = current.col + pick.dCol
    const row = current.row + pick.dRow
    cells[current.row][current.col].walls[pick.wall] = false
    cells[row][col].walls[pick.opposite] = false
    visited[row][col] = true
    stack.push({ col, row })
  }

  return { cols, rows, cells, solution: solveMaze(cells, cols, rows) }
}

/**
 * Szuka drogi z lewego górnego rogu do prawego dolnego.
 * W labiryncie doskonałym zwykły DFS znajduje jedyną istniejącą trasę.
 */
function solveMaze(cells: MazeCell[][], cols: number, rows: number) {
  const visited = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false))
  const path: { col: number; row: number }[] = []

  const walk = (col: number, row: number): boolean => {
    visited[row][col] = true
    path.push({ col, row })
    if (col === cols - 1 && row === rows - 1) return true

    for (const { dCol, dRow, wall } of DIRECTIONS) {
      if (cells[row][col].walls[wall]) continue
      const nextCol = col + dCol
      const nextRow = row + dRow
      if (nextCol < 0 || nextCol >= cols || nextRow < 0 || nextRow >= rows) continue
      if (visited[nextRow][nextCol]) continue
      if (walk(nextCol, nextRow)) return true
    }

    path.pop()
    return false
  }

  walk(0, 0)
  return path
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
