import { DEFAULT_WORKSHEET_HEADER, ITEM_SCALE_DEFAULT } from './types/worksheet'
import type { PageOrientation, ProjectState, WorksheetPage, WorksheetState } from './types/worksheet'
import type { WorksheetExample } from './examples'
import { createId } from './utils'

// Tworzenie pustych kart, stron i zadań - wspólne dla App, „Moich kart" i testów.

export const INITIAL_WORKSHEET: WorksheetState = {
  id: createId(),
  template: null,
  instruction: '',
  items: [],
  pairs: [],
  countRepetitions: 5,
  layout: 'row',
  itemScale: ITEM_SCALE_DEFAULT,
  orientation: 'portrait',
  instructionScale: 1,
  sequenceItems: [],
  sequenceRepetitions: 3,
  sequenceBlanks: 1,
  header: DEFAULT_WORKSHEET_HEADER,
  cutCardsShowBorder: true,
  categories: ['Kategoria 1', 'Kategoria 2'],
  variantCount: 1,
  correctAnswers: [],
  yesNoUseColors: false,
  choiceShowCheckboxes: false,
  matchPairsLineStyle: 'solid',
  countScattered: false,
  sequenceBlankStyle: 'underscore',
  cutCardsPerRow: 3,
  sameOrDifferentReferenceStyle: 'box',
  categorizeLayout: 'columns',
  patternLength: 50,
  wordSearchAllowHorizontal: true,
  wordSearchAllowVertical: true,
}

export const INITIAL_PROJECT: ProjectState = {
  pages: [createPage()],
  activePageIndex: 0,
  activeTaskIndex: 0,
  showPageNumbers: false,
  showBranding: true,
}

export function createWorksheet(overrides: Partial<WorksheetState> = {}): WorksheetState {
  return {
    ...INITIAL_WORKSHEET,
    id: createId(),
    header: { ...DEFAULT_WORKSHEET_HEADER },
    items: [],
    pairs: [],
    sequenceItems: [],
    categories: ['Kategoria 1', 'Kategoria 2'],
    correctAnswers: [],
    ...overrides,
  }
}

/** Świeża pusta karta - z nowymi id, w przeciwieństwie do współdzielonego INITIAL_PROJECT. */
export function createBlankProject(): ProjectState {
  return { pages: [createPage()], activePageIndex: 0, activeTaskIndex: 0, showPageNumbers: false, showBranding: true }
}

export function createPage(orientation: PageOrientation = 'portrait', task?: WorksheetState): WorksheetPage {
  return {
    id: createId(),
    orientation,
    header: { ...DEFAULT_WORKSHEET_HEADER },
    variantCount: 1,
    tasks: [task ?? createWorksheet({ orientation })],
  }
}

/** Przykład zastępuje bieżące zadanie i uzupełnia nagłówek strony - jedna zmiana, jeden krok cofania. */
export function applyExample(project: ProjectState, example: WorksheetExample): ProjectState {
  const pages = [...project.pages]
  const page = pages[project.activePageIndex]
  if (!page) return project
  const taskIndex = Math.min(project.activeTaskIndex, page.tasks.length - 1)
  const tasks = [...page.tasks]
  tasks[taskIndex] = createWorksheet({
    orientation: page.orientation,
    instructionScale: tasks[taskIndex]?.instructionScale ?? 1,
    template: example.template,
    ...example.task,
  })
  pages[project.activePageIndex] = { ...page, tasks, header: { ...page.header, ...example.header } }
  return { ...project, pages }
}
