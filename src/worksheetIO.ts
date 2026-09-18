// Eksport/import całego stanu karty pracy do/z pliku JSON - bez backendu, bez localStorage.
import type {
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

const VALID_TEMPLATES: TemplateType[] = ['choice', 'matchPairs', 'count', 'yesNo', 'oddOneOut', 'sequence', 'cutCards']
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
