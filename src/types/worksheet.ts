// Wspólny model danych dla każdego elementu dodanego do karty pracy,
// niezależnie od tego, czy jest to własny obraz, czy emoji z biblioteki.

export type WorksheetItemSource = 'image' | 'emoji'

export interface WorksheetItem {
  /** Unikalny identyfikator elementu (do listy, usuwania, zmiany kolejności). */
  id: string
  source: WorksheetItemSource
  /** Dla obrazu: Data URL (base64) wygenerowany z pliku wybranego przez użytkownika. */
  imageDataUrl?: string
  /** Dla emoji: sam znak Unicode, np. "🐶". */
  emoji?: string
  /** Etykieta pomocnicza pokazywana na liście elementów w edytorze. */
  label: string
}

export type TemplateType = 'choice' | 'matchPairs' | 'count'

/** Układ elementów w szablonie „Wybierz”. */
export type ChoiceLayout = 'row' | 'scattered'

/** Rozmiar elementów (obrazów/emoji) na kartce. */
export type ItemSize = 'sm' | 'md' | 'lg'

export const ITEM_SIZE_OPTIONS: { value: ItemSize; label: string }[] = [
  { value: 'sm', label: 'Małe' },
  { value: 'md', label: 'Średnie' },
  { value: 'lg', label: 'Duże' },
]

export interface TemplateOption {
  value: TemplateType
  label: string
  description: string
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    value: 'choice',
    label: 'Wybierz',
    description: 'Polecenie i kilka obrazów/emoji do wyboru.',
  },
  {
    value: 'matchPairs',
    label: 'Połącz w pary',
    description: 'Dwie kolumny elementów do połączenia liniami.',
  },
  {
    value: 'count',
    label: 'Policz',
    description: 'Jeden element powtórzony wielokrotnie + pole na odpowiedź.',
  },
]

/**
 * Para elementów dla szablonu „Połącz w pary”.
 * `right` jest `null`, dopóki użytkownik nie doda drugiego elementu pary.
 */
export interface MatchPair {
  id: string
  left: WorksheetItem
  right: WorksheetItem | null
}

/** Pełny stan karty pracy edytowanej przez użytkownika. */
export interface WorksheetState {
  template: TemplateType
  instruction: string
  /** Elementy używane przez szablony „Wybierz” i „Policz”. */
  items: WorksheetItem[]
  /** Pary elementów używane przez szablon „Połącz w pary”. */
  pairs: MatchPair[]
  /** Liczba powtórzeń elementu w szablonie „Policz” (1-10). */
  countRepetitions: number
  /** Układ elementów - dotyczy szablonu „Wybierz”. */
  layout: ChoiceLayout
  /** Rozmiar elementów - dotyczy szablonów „Wybierz” i „Policz”. */
  itemSize: ItemSize
}
