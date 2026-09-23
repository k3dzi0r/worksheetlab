import type { TemplateType, WorksheetHeader, WorksheetState } from './types/worksheet'

/** Gotowa karta na start: szablon, treść zadania i nagłówek strony. */
export interface WorksheetExample {
  id: string
  title: string
  emoji: string
  template: TemplateType
  /** Pola zadania nadpisywane po wybraniu szablonu. */
  task: Partial<WorksheetState>
  /** Nagłówek należy do strony, nie do zadania, więc idzie osobno. */
  header: Partial<WorksheetHeader>
}

const STUDENT_HEADER: Partial<WorksheetHeader> = { showName: true, showDate: true }

export const WORKSHEET_EXAMPLES: WorksheetExample[] = [
  {
    id: 'farm-word-search',
    title: 'Zwierzęta na wsi',
    emoji: '🐄',
    template: 'wordSearch',
    task: {
      instruction: 'Znajdź i zakreśl nazwy zwierząt.',
      wordSearchWords: 'krowa\nkoń\nkaczka\nowca\nkura\nświnia',
      wordSearchGridSize: 10,
      wordSearchShowWords: true,
    },
    header: { ...STUDENT_HEADER, showTitle: true, title: 'Zwierzęta na wsi' },
  },
  {
    id: 'add-to-20',
    title: 'Dodawanie do 20',
    emoji: '➕',
    template: 'math',
    task: {
      instruction: 'Oblicz.',
      mathOperations: ['add'],
      mathMax: 20,
      mathCrossTen: false,
      mathMissing: 'result',
    },
    header: { ...STUDENT_HEADER, showTitle: true, title: 'Dodawanie do 20' },
  },
  {
    id: 'seasons-crossword',
    title: 'Pory roku',
    emoji: '🍂',
    template: 'crossword',
    task: {
      instruction: 'Rozwiąż krzyżówkę.',
      crosswordWords:
        'wiosna - Pora roku, gdy kwitną przebiśniegi\nlato - Najcieplejsza pora roku\njesień - Liście zmieniają kolor\nzima - Pada śnieg',
      crosswordShowClues: true,
      crosswordNumbers: true,
    },
    header: { ...STUDENT_HEADER, showTitle: true, title: 'Pory roku' },
  },
  {
    id: 'easy-maze',
    title: 'Łatwy labirynt',
    emoji: '🧭',
    template: 'maze',
    task: { instruction: 'Znajdź drogę do wyjścia.', mazeLevel: 1 },
    header: STUDENT_HEADER,
  },
  {
    id: 'full-hours',
    title: 'Pełne godziny',
    emoji: '🕒',
    template: 'clock',
    task: { instruction: 'Która jest godzina?', clockMode: 'read', clockPrecision: 'hour' },
    header: STUDENT_HEADER,
  },
  {
    id: 'first-sentence',
    title: 'Ala ma kota',
    emoji: '✏️',
    template: 'handwriting',
    task: { handwritingText: 'Ala ma kota.', handwritingMode: 'tracing', handwritingRepeat: true },
    header: STUDENT_HEADER,
  },
]
