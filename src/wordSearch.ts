// Generator wykreślanki: układa słowa w siatce liter i dopełnia resztę losowymi literami.
// Wynik jest deterministyczny dla danego seeda, dzięki czemu podgląd nie "skacze" przy każdym renderze.

import { createSeededRandom } from './utils'

/** Polski alfabet użyty do wypełnienia pustych pól - bez liter, których nie ma w polskich wyrazach. */
const FILLER_LETTERS = 'AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ'

export interface PlacedWord {
  word: string
  /** Pozycje kolejnych liter słowa w siatce (wiersz, kolumna). */
  cells: { row: number; col: number }[]
}

export interface WordSearchResult {
  grid: string[][]
  placed: PlacedWord[]
  /** Słowa, dla których zabrakło miejsca w siatce - pokazujemy je jako ostrzeżenie w edytorze. */
  skipped: string[]
}

export interface WordSearchOptions {
  cols: number
  rows: number
  allowDiagonals: boolean
  allowReverse: boolean
  /**
   * Czym wypełniamy puste pola. „fromWords" bierze litery z ukrytych słów, przez co
   * siatka wygląda spójniej, ale jest trudniejsza - przypadkowa litera nie zdradza już,
   * że w danym miejscu nic nie ma.
   */
  filler: 'random' | 'fromWords'
  seed: number
}

/** Kierunki układania słów: [dRow, dCol]. */
const STRAIGHT: [number, number][] = [
  [0, 1],
  [1, 0],
]
const DIAGONAL: [number, number][] = [
  [1, 1],
  [1, -1],
]

/** Normalizuje słowo: usuwa spacje i znaki inne niż litery, zamienia na wielkie litery. */
export function normalizeWord(word: string): string {
  return word
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g, '')
}

export function parseWords(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map(normalizeWord)
    .filter((word) => word.length >= 2)
}

export function generateWordSearch(words: string[], options: WordSearchOptions): WordSearchResult {
  const { cols, rows, allowDiagonals, allowReverse, filler, seed } = options
  const random = createSeededRandom(seed)

  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array<string | null>(cols).fill(null))
  const placed: PlacedWord[] = []
  const skipped: string[] = []

  const directions: [number, number][] = [...STRAIGHT, ...(allowDiagonals ? DIAGONAL : [])]

  // Najdłuższe słowa układamy pierwsze - mają najmniej możliwych pozycji.
  // Słowa tej samej długości tasujemy, żeby kolejność wpisania nie decydowała o miejscu w siatce.
  const ordered = [...words]
    .map((word) => ({ word, tie: random() }))
    .sort((a, b) => b.word.length - a.word.length || a.tie - b.tie)
    .map((entry) => entry.word)

  for (const word of ordered) {
    if (word.length > Math.max(cols, rows)) {
      skipped.push(word)
      continue
    }

    const candidates: { row: number; col: number; dRow: number; dCol: number }[] = []
    for (const [dRow, dCol] of directions) {
      for (const reverse of allowReverse ? [false, true] : [false]) {
        const stepRow = reverse ? -dRow : dRow
        const stepCol = reverse ? -dCol : dCol
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const endRow = row + stepRow * (word.length - 1)
            const endCol = col + stepCol * (word.length - 1)
            if (endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) continue

            let fits = true
            for (let i = 0; i < word.length; i++) {
              const cell = grid[row + stepRow * i][col + stepCol * i]
              if (cell !== null && cell !== word[i]) {
                fits = false
                break
              }
            }
            if (fits) candidates.push({ row, col, dRow: stepRow, dCol: stepCol })
          }
        }
      }
    }

    if (candidates.length === 0) {
      skipped.push(word)
      continue
    }

    const choice = candidates[Math.floor(random() * candidates.length)]
    const cells: { row: number; col: number }[] = []
    for (let i = 0; i < word.length; i++) {
      const row = choice.row + choice.dRow * i
      const col = choice.col + choice.dCol * i
      grid[row][col] = word[i]
      cells.push({ row, col })
    }
    placed.push({ word, cells })
  }

  // Litery do wypełnienia pustych pól: cały alfabet albo tylko te z ukrytych słów.
  const wordLetters = Array.from(new Set(placed.flatMap((entry) => entry.word.split(''))))
  const pool = filler === 'fromWords' && wordLetters.length >= 4 ? wordLetters.join('') : FILLER_LETTERS

  const filled = grid.map((row) => row.map((cell) => cell ?? pool[Math.floor(random() * pool.length)]))

  return { grid: filled, placed, skipped }
}
