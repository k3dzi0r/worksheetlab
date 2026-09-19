// Eksport/import całego stanu karty pracy do/z pliku JSON - bez backendu, bez localStorage.
import { normalizeHandwritingFont } from './handwritingFonts'
import type { MathMissing, MathOperation } from './mathTasks'
import type { MazeCarver, MazeDeadEnds, MazeEnds } from './maze'

const VALID_MATH_OPERATIONS: MathOperation[] = ['add', 'sub', 'mul', 'div']

/** Karta bez zaznaczonego działania byłaby pusta, więc zawsze zostawiamy przynajmniej dodawanie. */
function normalizeMathOperations(value: unknown): MathOperation[] {
  if (!Array.isArray(value)) return ['add']
  const operations = value.filter((op): op is MathOperation => VALID_MATH_OPERATIONS.includes(op as MathOperation))
  return operations.length > 0 ? operations : ['add']
}
import type {
  ProjectState,
  WorksheetState,
  WorksheetItem,
  MatchPair,
  TemplateType,
  ChoiceLayout,
  PageOrientation,
} from './types/worksheet'
import { ITEM_SCALE_DEFAULT, ITEM_SCALE_MIN, ITEM_SCALE_MAX, DEFAULT_WORKSHEET_HEADER } from './types/worksheet'
import type { WorksheetHeader } from './types/worksheet'
import { clamp } from './utils'

const VALID_TEMPLATES: TemplateType[] = [
  'choice',
  'matchPairs',
  'count',
  'yesNo',
  'oddOneOut',
  'sequence',
  'cutCards',
  'sameOrDifferent',
  'categorize',
  'handwriting',
  'wordSearch',
  'maze',
  'coloring',
  'math',
  'pattern',
  'crossword',
  'dotToDot',
  'clock',
]
const VALID_LAYOUTS: ChoiceLayout[] = ['row', 'scattered']
const VALID_ORIENTATIONS: PageOrientation[] = ['portrait', 'landscape']

// Pliki wyeksportowane przed wprowadzeniem płynnego suwaka rozmiaru zapisywały rozmiar
// jako 'sm'/'md'/'lg' - mapujemy je na przybliżone wartości liczbowe dla zgodności wstecznej.
const LEGACY_SIZE_TO_SCALE: Record<string, number> = { sm: 0.75, md: 1, lg: 1.35 }

function normalizeItemScale(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return clamp(value, ITEM_SCALE_MIN, ITEM_SCALE_MAX)
  if (typeof value === 'string' && value in LEGACY_SIZE_TO_SCALE) return LEGACY_SIZE_TO_SCALE[value]
  return undefined
}

function isWorksheetItem(value: unknown): value is WorksheetItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    (item.source === 'image' || item.source === 'emoji') &&
    typeof item.label === 'string'
  )
}

function isMatchPair(value: unknown): value is MatchPair {
  if (!value || typeof value !== 'object') return false
  const pair = value as Record<string, unknown>
  return typeof pair.id === 'string' && isWorksheetItem(pair.left) && (pair.right === null || isWorksheetItem(pair.right))
}

/** Normalizuje nagłówek karty z pliku JSON - brakujące pole lub zły typ zastępujemy wartością domyślną. */
function normalizeHeader(value: unknown): WorksheetHeader {
  if (!value || typeof value !== 'object') return DEFAULT_WORKSHEET_HEADER
  const header = value as Record<string, unknown>
  return {
    showTitle: typeof header.showTitle === 'boolean' ? header.showTitle : DEFAULT_WORKSHEET_HEADER.showTitle,
    title: typeof header.title === 'string' ? header.title : DEFAULT_WORKSHEET_HEADER.title,
    showName: typeof header.showName === 'boolean' ? header.showName : DEFAULT_WORKSHEET_HEADER.showName,
    nameLabel: typeof header.nameLabel === 'string' ? header.nameLabel : DEFAULT_WORKSHEET_HEADER.nameLabel,
    showDate: typeof header.showDate === 'boolean' ? header.showDate : DEFAULT_WORKSHEET_HEADER.showDate,
    dateLabel: typeof header.dateLabel === 'string' ? header.dateLabel : DEFAULT_WORKSHEET_HEADER.dateLabel,
    showClass: typeof header.showClass === 'boolean' ? header.showClass : DEFAULT_WORKSHEET_HEADER.showClass,
    classLabel: typeof header.classLabel === 'string' ? header.classLabel : DEFAULT_WORKSHEET_HEADER.classLabel,
  }
}

/**
 * Sprawdza i normalizuje wczytany plik JSON. Brakujące/nieznane pola (np. z wcześniejszej
 * wersji aplikacji) są uzupełniane sensownymi wartościami domyślnymi zamiast wywalać błąd.
 * Zwraca `null`, gdy plik nie ma nawet minimalnej poprawnej struktury karty pracy.
 */
export function parseWorksheetJson(text: string): WorksheetState | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const state = data as Record<string, unknown>

  if (typeof state.template !== 'string' || !VALID_TEMPLATES.includes(state.template as TemplateType)) return null
  if (typeof state.instruction !== 'string') return null
  if (!Array.isArray(state.items) || !state.items.every(isWorksheetItem)) return null
  if (!Array.isArray(state.pairs) || !state.pairs.every(isMatchPair)) return null

  const sequenceItems =
    Array.isArray(state.sequenceItems) && state.sequenceItems.every(isWorksheetItem)
      ? (state.sequenceItems as WorksheetItem[])
      : []

  return {
    template: state.template as TemplateType,
    instruction: state.instruction,
    items: state.items as WorksheetItem[],
    pairs: state.pairs as MatchPair[],
    countRepetitions: typeof state.countRepetitions === 'number' ? state.countRepetitions : 5,
    layout: VALID_LAYOUTS.includes(state.layout as ChoiceLayout) ? (state.layout as ChoiceLayout) : 'row',
    itemScale: normalizeItemScale(state.itemScale ?? state.itemSize) ?? ITEM_SCALE_DEFAULT,
    orientation: VALID_ORIENTATIONS.includes(state.orientation as PageOrientation)
      ? (state.orientation as PageOrientation)
      : 'portrait',
    simpleMode: typeof state.simpleMode === 'boolean' ? state.simpleMode : false,
    sequenceItems,
    sequenceRepetitions: typeof state.sequenceRepetitions === 'number' ? state.sequenceRepetitions : 3,
    sequenceBlanks: typeof state.sequenceBlanks === 'number' ? state.sequenceBlanks : 1,
    header: normalizeHeader(state.header),
    cutCardsShowBorder: typeof state.cutCardsShowBorder === 'boolean' ? state.cutCardsShowBorder : true,
    categories: Array.isArray(state.categories) && state.categories.every((c) => typeof c === 'string')
      ? (state.categories as string[])
      : ['Kategoria 1', 'Kategoria 2'],
    variantCount: typeof state.variantCount === 'number' ? state.variantCount : 1,
    correctAnswers: Array.isArray(state.correctAnswers) ? state.correctAnswers : [],
    handwritingText: typeof state.handwritingText === 'string' ? state.handwritingText : '',
    handwritingMode: (['solid', 'tracing', 'empty'].includes(state.handwritingMode as string)) ? state.handwritingMode as any : 'tracing',
    handwritingRepeat: typeof state.handwritingRepeat === 'boolean' ? state.handwritingRepeat : false,
    handwritingFont: normalizeHandwritingFont(state.handwritingFont),
    handwritingTrace: (['light', 'medium', 'dark'] as const).includes(state.handwritingTrace as 'light')
      ? (state.handwritingTrace as 'light')
      : 'medium',
    handwritingGuides: (['full', 'baseline', 'none'] as const).includes(state.handwritingGuides as 'full')
      ? (state.handwritingGuides as 'full')
      : 'full',
    handwritingEveryOther:
      typeof state.handwritingEveryOther === 'boolean' ? state.handwritingEveryOther : false,
    handwritingStartDot: typeof state.handwritingStartDot === 'boolean' ? state.handwritingStartDot : false,
    clockMode: (['read', 'draw', 'mixed'] as const).includes(state.clockMode as 'read')
      ? (state.clockMode as 'read')
      : 'read',
    clockPrecision: (['hour', 'half', 'quarter', 'five', 'minute'] as const).includes(
      state.clockPrecision as 'hour',
    )
      ? (state.clockPrecision as 'hour')
      : 'hour',
    clockFormat24: typeof state.clockFormat24 === 'boolean' ? state.clockFormat24 : false,
    clockDial: (['all', 'quarters', 'none'] as const).includes(state.clockDial as 'all')
      ? (state.clockDial as 'all')
      : 'all',
    clockMinuteTicks: typeof state.clockMinuteTicks === 'boolean' ? state.clockMinuteTicks : true,
    dotShape: typeof state.dotShape === 'string' ? state.dotShape : 'star',
    dotCount: typeof state.dotCount === 'number' ? state.dotCount : 20,
    dotNumbering: (['numbers', 'evens', 'backwards', 'letters'] as const).includes(
      state.dotNumbering as 'numbers',
    )
      ? (state.dotNumbering as 'numbers')
      : 'numbers',
    dotShowOutline: typeof state.dotShowOutline === 'boolean' ? state.dotShowOutline : false,
    crosswordWords: typeof state.crosswordWords === 'string' ? state.crosswordWords : '',
    crosswordKeyword: typeof state.crosswordKeyword === 'string' ? state.crosswordKeyword : '',
    crosswordShowClues: typeof state.crosswordShowClues === 'boolean' ? state.crosswordShowClues : true,
    crosswordNumbers: typeof state.crosswordNumbers === 'boolean' ? state.crosswordNumbers : true,
    patternId: typeof state.patternId === 'string' ? state.patternId : 'waves',
    patternHelp: typeof state.patternHelp === 'string' ? state.patternHelp : 'medium',
    patternGuides: typeof state.patternGuides === 'boolean' ? state.patternGuides : true,
    patternStartDot: typeof state.patternStartDot === 'boolean' ? state.patternStartDot : true,
    mathOperations: normalizeMathOperations(state.mathOperations),
    mathMax: typeof state.mathMax === 'number' ? state.mathMax : 20,
    mathCrossTen: typeof state.mathCrossTen === 'boolean' ? state.mathCrossTen : true,
    mathMissing: (['result', 'operand', 'mixed'] as const).includes(state.mathMissing as MathMissing)
      ? (state.mathMissing as MathMissing)
      : 'result',
    coloringLevel: typeof state.coloringLevel === 'number' ? state.coloringLevel : 2,
    coloringMode: state.coloringMode === 'numbers' ? 'numbers' : 'blank',
    coloringColorCount: typeof state.coloringColorCount === 'number' ? state.coloringColorCount : 4,
    coloringSectors: typeof state.coloringSectors === 'number' ? state.coloringSectors : 0,
    coloringCrown: (['auto', 'scallop', 'petal', 'points', 'none'] as const).includes(
      state.coloringCrown as 'auto',
    )
      ? (state.coloringCrown as 'auto')
      : 'auto',
    coloringStroke: typeof state.coloringStroke === 'number' ? state.coloringStroke : 1,
    mazeLevel: typeof state.mazeLevel === 'number' ? state.mazeLevel : 2,
    mazeCarver: (['random', 'winding', 'branching'] as const).includes(state.mazeCarver as MazeCarver)
      ? (state.mazeCarver as MazeCarver)
      : 'random',
    mazeDeadEnds: (['many', 'few', 'none'] as const).includes(state.mazeDeadEnds as MazeDeadEnds)
      ? (state.mazeDeadEnds as MazeDeadEnds)
      : 'many',
    mazeEnds: (['random', 'corners', 'edges'] as const).includes(state.mazeEnds as MazeEnds)
      ? (state.mazeEnds as MazeEnds)
      : 'random',
    wordSearchWords: typeof state.wordSearchWords === 'string' ? state.wordSearchWords : '',
    wordSearchGridSize: typeof state.wordSearchGridSize === 'number' ? state.wordSearchGridSize : 10,
    wordSearchAllowDiagonals: typeof state.wordSearchAllowDiagonals === 'boolean' ? state.wordSearchAllowDiagonals : false,
    wordSearchAllowReverse: typeof state.wordSearchAllowReverse === 'boolean' ? state.wordSearchAllowReverse : false,
    wordSearchUppercase: typeof state.wordSearchUppercase === 'boolean' ? state.wordSearchUppercase : true,
    wordSearchShape: state.wordSearchShape === 'page' ? 'page' : 'square',
    wordSearchShowWords: typeof state.wordSearchShowWords === 'boolean' ? state.wordSearchShowWords : true,
    wordSearchFiller: state.wordSearchFiller === 'fromWords' ? 'fromWords' : 'random',
  }
}

/** Pobiera bieżący stan karty jako plik `.json` (nazwa zawiera datę). */
export function downloadWorksheetJson(worksheet: WorksheetState) {
  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `worksheetlab-${dateStr}.json`
  const blob = new Blob([JSON.stringify(worksheet, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}


/** Paruje cały projekt z pliku JSON. Zapewnia kompatybilność wsteczną. */
export function parseProjectJson(text: string): ProjectState | null {
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  
  if (!data || typeof data !== 'object') return null

  // Jeśli JSON to stary pojedynczy WorksheetState:
  if (typeof data.template === 'string') {
    const single = parseWorksheetJson(text)
    if (!single) return null
    return { pages: [single], activePageIndex: 0 }
  }

  // Jeśli JSON to nowy ProjectState:
  if (Array.isArray(data.pages)) {
    const pages = data.pages.map((p: any) => parseWorksheetJson(JSON.stringify(p))).filter(Boolean) as WorksheetState[]
    if (pages.length === 0) return null
    return {
      pages,
      activePageIndex: typeof data.activePageIndex === 'number' && data.activePageIndex < pages.length ? data.activePageIndex : 0,
      showPageNumbers: typeof data.showPageNumbers === 'boolean' ? data.showPageNumbers : false
    }
  }

  return null
}

/** Pobiera cały projekt jako plik .json. */
export function downloadProjectJson(project: ProjectState) {
  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `worksheetlab-project-${dateStr}.json`
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
