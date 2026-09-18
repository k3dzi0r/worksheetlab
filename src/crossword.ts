// Generator krzyżówki z hasłem.
//
// Klasyczna krzyżówka z krzyżującymi się słowami wymaga słownika, którego tu nie mamy -
// nauczyciel podaje własne słowa z definicjami. Dlatego budujemy krzyżówkę „grzebieniową":
// hasło stoi w pionowej kolumnie, a każde słowo leży poziomo tak, aby jego wybrana litera
// wypadła dokładnie w tej kolumnie. To układ znany z kart pracy i zeszytów ćwiczeń.

import { createSeededRandom } from './utils'
import { normalizeWord } from './wordSearch'

export interface CrosswordEntry {
  /** Hasło do wpisania przez ucznia, wielkimi literami. */
  word: string
  /** Definicja pokazywana pod krzyżówką. */
  clue: string
  /** Indeks litery, która wpada do kolumny z hasłem. */
  keyIndex: number
  /** Numer wiersza w siatce. */
  row: number
  /** Kolumna, w której zaczyna się słowo. */
  startCol: number
}

export interface Crossword {
  entries: CrosswordEntry[]
  /** Kolumna, w której czyta się hasło z góry na dół. */
  keyColumn: number
  cols: number
  /** Hasło złożone z zaznaczonych liter - puste, gdy nie da się go ułożyć. */
  keyword: string
  /** Litery hasła, do których zabrakło słowa. */
  missingLetters: string[]
  /** Słowa, które nie trafiły do krzyżówki, bo nie były potrzebne. */
  unusedWords: string[]
}

export interface CrosswordInput {
  word: string
  clue: string
}

/**
 * Wiersz w edytorze ma postać `słowo - definicja`. Bez definicji zostaje samo słowo,
 * żeby nauczyciel mógł najpierw wrzucić listę, a definicje dopisać później.
 */
export function parseCrosswordLines(text: string): CrosswordInput[] {
  return text
    .split('\n')
    .map((line) => {
      const [rawWord, ...rest] = line.split(/\s[-–—]\s|;|\t/)
      const word = normalizeWord(rawWord || '')
      if (word.length < 2) return null
      return { word, clue: rest.join(' ').trim() }
    })
    .filter((entry): entry is CrosswordInput => entry !== null)
}

export interface CrosswordOptions {
  /** Hasło do odczytania w kolumnie. Puste oznacza „dobierz litery losowo". */
  keyword: string
  seed: number
}

/**
 * Maksymalne skojarzenie dwudzielne (algorytm Kuhna): litera hasła po jednej stronie,
 * słowo po drugiej, krawędź gdy słowo zawiera tę literę.
 *
 * Proste przydzielanie „pierwsze pasujące słowo" gubiło litery: przy haśle WIOSNA słowo
 * z literą N bywało już zużyte na wcześniejszą literę, choć dało się je przestawić.
 * Szukanie ścieżek powiększających takie kolizje rozwiązuje i wykorzystuje tyle liter,
 * ile w ogóle się da.
 */
function matchLettersToWords(letters: string[], words: CrosswordInput[]): (number | null)[] {
  const assignedTo: (number | null)[] = Array(words.length).fill(null)

  const tryAssign = (letterIndex: number, visited: boolean[]): boolean => {
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      if (visited[wordIndex]) continue
      if (!words[wordIndex].word.includes(letters[letterIndex])) continue
      visited[wordIndex] = true

      const current = assignedTo[wordIndex]
      if (current === null || tryAssign(current, visited)) {
        assignedTo[wordIndex] = letterIndex
        return true
      }
    }
    return false
  }

  for (let letterIndex = 0; letterIndex < letters.length; letterIndex++) {
    tryAssign(letterIndex, Array(words.length).fill(false))
  }

  // Zamiana perspektywy: dla każdej litery numer przypisanego słowa.
  const forLetter: (number | null)[] = Array(letters.length).fill(null)
  assignedTo.forEach((letterIndex, wordIndex) => {
    if (letterIndex !== null) forLetter[letterIndex] = wordIndex
  })
  return forLetter
}

export function buildCrossword(inputs: CrosswordInput[], options: CrosswordOptions): Crossword {
  const random = createSeededRandom(options.seed)
  const keyword = normalizeWord(options.keyword)
  const entries: CrosswordEntry[] = []
  const missingLetters: string[] = []
  const usedWords = new Set<number>()

  if (keyword.length > 0) {
    const letters = [...keyword]
    const matched = matchLettersToWords(letters, inputs)

    letters.forEach((letter, letterIndex) => {
      const wordIndex = matched[letterIndex]
      if (wordIndex === null) {
        missingLetters.push(letter)
        return
      }
      usedWords.add(wordIndex)
      const entry = inputs[wordIndex]
      // Gdy litera występuje kilka razy, losujemy które wystąpienie trafi do kolumny -
      // dzięki temu słowa nie układają się w schodki zawsze tak samo.
      const positions = [...entry.word].map((char, i) => (char === letter ? i : -1)).filter((i) => i >= 0)
      const keyIndex = positions[Math.floor(random() * positions.length)]
      entries.push({ ...entry, keyIndex, row: entries.length, startCol: 0 })
    })
  } else {
    inputs.forEach((entry, index) => {
      usedWords.add(index)
      entries.push({
        ...entry,
        keyIndex: Math.floor(random() * entry.word.length),
        row: entries.length,
        startCol: 0,
      })
    })
  }

  const unusedWords = inputs.filter((_, index) => !usedWords.has(index)).map((entry) => entry.word)

  // Kolumna z hasłem musi pomieścić najdłuższy „ogon" przed zaznaczoną literą.
  const keyColumn = entries.reduce((max, entry) => Math.max(max, entry.keyIndex), 0)
  for (const entry of entries) {
    entry.startCol = keyColumn - entry.keyIndex
  }

  const cols = entries.reduce((max, entry) => Math.max(max, entry.startCol + entry.word.length), keyColumn + 1)

  return {
    entries,
    keyColumn,
    cols,
    keyword: entries.map((entry) => entry.word[entry.keyIndex]).join(''),
    missingLetters,
    unusedWords,
  }
}
