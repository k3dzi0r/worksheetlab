// Eksport/import całego stanu karty pracy do/z pliku JSON - bez backendu, bez localStorage.
import type {
  WorksheetState,
  WorksheetItem,
  MatchPair,
  TemplateType,
  ChoiceLayout,
  ItemSize,
  PageOrientation,
} from './types/worksheet'

const VALID_TEMPLATES: TemplateType[] = ['choice', 'matchPairs', 'count', 'yesNo', 'oddOneOut', 'sequence']
const VALID_LAYOUTS: ChoiceLayout[] = ['row', 'scattered']
const VALID_SIZES: ItemSize[] = ['sm', 'md', 'lg']
const VALID_ORIENTATIONS: PageOrientation[] = ['portrait', 'landscape']

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
    itemSize: VALID_SIZES.includes(state.itemSize as ItemSize) ? (state.itemSize as ItemSize) : 'lg',
    orientation: VALID_ORIENTATIONS.includes(state.orientation as PageOrientation)
      ? (state.orientation as PageOrientation)
      : 'portrait',
    simpleMode: typeof state.simpleMode === 'boolean' ? state.simpleMode : false,
    sequenceItems,
    sequenceRepetitions: typeof state.sequenceRepetitions === 'number' ? state.sequenceRepetitions : 3,
    sequenceBlanks: typeof state.sequenceBlanks === 'number' ? state.sequenceBlanks : 1,
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
