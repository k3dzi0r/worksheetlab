import type { TemplateType, WorksheetHeader, WorksheetState } from './types/worksheet'

/** Tematy przykładów - nauczyciel zwykle szuka karty „na jesień" albo „na liczenie", nie po typie. */
export const EXAMPLE_THEMES = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'animals', label: 'Zwierzęta' },
  { value: 'seasons', label: 'Pory roku' },
  { value: 'counting', label: 'Liczenie' },
  { value: 'time', label: 'Zegar' },
  { value: 'writing', label: 'Pisanie' },
  { value: 'puzzles', label: 'Łamigłówki' },
] as const

export type ExampleTheme = Exclude<(typeof EXAMPLE_THEMES)[number]['value'], 'all'>

/** Gotowa karta na start: szablon, treść zadania i nagłówek strony. */
export interface WorksheetExample {
  id: string
  title: string
  emoji: string
  theme: ExampleTheme
  template: TemplateType
  /** Pola zadania nadpisywane po wybraniu szablonu. */
  task: Partial<WorksheetState>
  /** Nagłówek należy do strony, nie do zadania, więc idzie osobno. */
  header: Partial<WorksheetHeader>
}

const STUDENT_HEADER: Partial<WorksheetHeader> = { showName: true, showDate: true }

function titled(title: string): Partial<WorksheetHeader> {
  return { ...STUDENT_HEADER, showTitle: true, title }
}

export const WORKSHEET_EXAMPLES: WorksheetExample[] = [
  // Zwierzęta
  {
    id: 'farm-word-search',
    title: 'Zwierzęta na wsi',
    emoji: '🐄',
    theme: 'animals',
    template: 'wordSearch',
    task: {
      instruction: 'Znajdź i zakreśl nazwy zwierząt.',
      wordSearchWords: 'krowa\nkoń\nkaczka\nowca\nkura\nświnia',
      wordSearchGridSize: 10,
      wordSearchShowWords: true,
    },
    header: titled('Zwierzęta na wsi'),
  },
  {
    id: 'forest-crossword',
    title: 'Mieszkańcy lasu',
    emoji: '🦊',
    theme: 'animals',
    template: 'crossword',
    task: {
      instruction: 'Rozwiąż krzyżówkę.',
      crosswordWords:
        'lis - Rudy, ma puszysty ogon\njeż - Ma kolce na grzbiecie\nsowa - Poluje nocą, huka\nwiewiórka - Zbiera orzechy na zimę\ndzik - Ryje w ziemi',
      crosswordShowClues: true,
      crosswordNumbers: true,
    },
    header: titled('Mieszkańcy lasu'),
  },
  {
    id: 'butterfly-dots',
    title: 'Ukryty motyl',
    emoji: '🦋',
    theme: 'animals',
    template: 'dotToDot',
    task: { instruction: 'Połącz kropki po kolei i pokoloruj.', dotShape: 'butterfly', dotCount: 20, dotNumbering: 'numbers' },
    header: STUDENT_HEADER,
  },

  // Pory roku
  {
    id: 'seasons-crossword',
    title: 'Pory roku',
    emoji: '🍂',
    theme: 'seasons',
    template: 'crossword',
    task: {
      instruction: 'Rozwiąż krzyżówkę.',
      crosswordWords:
        'wiosna - Pora roku, gdy kwitną przebiśniegi\nlato - Najcieplejsza pora roku\njesień - Liście zmieniają kolor\nzima - Pada śnieg',
      crosswordShowClues: true,
      crosswordNumbers: true,
    },
    header: titled('Pory roku'),
  },
  {
    id: 'autumn-word-search',
    title: 'Jesień w parku',
    emoji: '🌰',
    theme: 'seasons',
    template: 'wordSearch',
    task: {
      instruction: 'Znajdź jesienne słowa.',
      wordSearchWords: 'liść\nkasztan\nżołądź\ngrzyb\ndeszcz\nparasol',
      wordSearchGridSize: 10,
      wordSearchShowWords: true,
    },
    header: titled('Jesień w parku'),
  },
  {
    id: 'winter-mandala',
    title: 'Zimowa mandala',
    emoji: '❄️',
    theme: 'seasons',
    template: 'coloring',
    task: { instruction: 'Pokoloruj mandalę zimowymi kolorami.', coloringLevel: 2, coloringMode: 'blank', coloringSectors: 6 },
    header: STUDENT_HEADER,
  },

  // Liczenie
  {
    id: 'add-to-10',
    title: 'Dodawanie do 10',
    emoji: '🍎',
    theme: 'counting',
    template: 'math',
    task: { instruction: 'Oblicz.', mathOperations: ['add'], mathMax: 10, mathCrossTen: false, mathMissing: 'result' },
    header: titled('Dodawanie do 10'),
  },
  {
    id: 'add-to-20',
    title: 'Dodawanie do 20',
    emoji: '➕',
    theme: 'counting',
    template: 'math',
    task: { instruction: 'Oblicz.', mathOperations: ['add'], mathMax: 20, mathCrossTen: false, mathMissing: 'result' },
    header: titled('Dodawanie do 20'),
  },
  {
    id: 'add-sub-20',
    title: 'Dodawanie i odejmowanie do 20',
    emoji: '➖',
    theme: 'counting',
    template: 'math',
    task: { instruction: 'Oblicz.', mathOperations: ['add', 'sub'], mathMax: 20, mathCrossTen: true, mathMissing: 'result' },
    header: titled('Dodawanie i odejmowanie'),
  },
  {
    id: 'multiplication',
    title: 'Tabliczka mnożenia',
    emoji: '✖️',
    theme: 'counting',
    template: 'math',
    task: { instruction: 'Oblicz.', mathOperations: ['mul'], mathMax: 100, mathMissing: 'result' },
    header: titled('Tabliczka mnożenia'),
  },
  {
    id: 'missing-number',
    title: 'Brakująca liczba',
    emoji: '❓',
    theme: 'counting',
    template: 'math',
    task: { instruction: 'Wpisz brakującą liczbę.', mathOperations: ['add', 'sub'], mathMax: 20, mathMissing: 'operand' },
    header: titled('Brakująca liczba'),
  },

  // Zegar
  {
    id: 'full-hours',
    title: 'Pełne godziny',
    emoji: '🕒',
    theme: 'time',
    template: 'clock',
    task: { instruction: 'Która jest godzina?', clockMode: 'read', clockPrecision: 'hour' },
    header: STUDENT_HEADER,
  },
  {
    id: 'half-hours',
    title: 'Wpół do',
    emoji: '🕧',
    theme: 'time',
    template: 'clock',
    task: { instruction: 'Która jest godzina?', clockMode: 'read', clockPrecision: 'half' },
    header: STUDENT_HEADER,
  },
  {
    id: 'draw-hands',
    title: 'Narysuj wskazówki',
    emoji: '✍️',
    theme: 'time',
    template: 'clock',
    task: { instruction: 'Narysuj wskazówki.', clockMode: 'draw', clockPrecision: 'quarter' },
    header: STUDENT_HEADER,
  },

  // Pisanie
  {
    id: 'first-sentence',
    title: 'Ala ma kota',
    emoji: '✏️',
    theme: 'writing',
    template: 'handwriting',
    task: { handwritingText: 'Ala ma kota.', handwritingMode: 'tracing', handwritingRepeat: true },
    header: STUDENT_HEADER,
  },
  {
    id: 'mama-sentence',
    title: 'Mama ma mleko',
    emoji: '🥛',
    theme: 'writing',
    template: 'handwriting',
    task: { handwritingText: 'Mama ma mleko.', handwritingMode: 'tracing', handwritingRepeat: true, handwritingEveryOther: true },
    header: STUDENT_HEADER,
  },
  {
    id: 'mixed-patterns',
    title: 'Szlaczki na rozgrzewkę',
    emoji: '〰️',
    theme: 'writing',
    template: 'pattern',
    task: { instruction: 'Rysuj po śladzie, a potem sam.', patternId: 'mixed', patternStartDot: true },
    header: STUDENT_HEADER,
  },

  // Łamigłówki
  {
    id: 'easy-maze',
    title: 'Łatwy labirynt',
    emoji: '🧭',
    theme: 'puzzles',
    template: 'maze',
    task: { instruction: 'Znajdź drogę do wyjścia.', mazeLevel: 1 },
    header: STUDENT_HEADER,
  },
  {
    id: 'hard-maze',
    title: 'Trudny labirynt',
    emoji: '🏰',
    theme: 'puzzles',
    template: 'maze',
    task: { instruction: 'Znajdź drogę do wyjścia.', mazeLevel: 4 },
    header: STUDENT_HEADER,
  },
  {
    id: 'color-by-number',
    title: 'Koloruj według kodu',
    emoji: '🎨',
    theme: 'puzzles',
    template: 'coloring',
    task: { instruction: 'Pokoloruj pola według kodu.', coloringLevel: 2, coloringMode: 'numbers', coloringColorCount: 4 },
    header: STUDENT_HEADER,
  },
]
