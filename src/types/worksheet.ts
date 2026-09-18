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
  /** Opcjonalny podpis wyświetlany pod elementem w podglądzie i na wydruku. */
  caption?: string
  /** Czy podpis ma być widoczny (domyślnie true, jeśli caption jest ustawiony). */
  showCaption?: boolean
  /** Indywidualny mnożnik rozmiaru elementu. Brak wartości = użyj globalnego rozmiaru szablonu. */
  scale?: number
}

export type TemplateType = 'choice' | 'matchPairs' | 'count' | 'yesNo' | 'oddOneOut' | 'sequence' | 'cutCards' | 'sameOrDifferent' | 'categorize' | 'handwriting'

/** Układ elementów w szablonie „Wybierz”. */
export type ChoiceLayout = 'row' | 'scattered'

/** Zakres płynnego suwaka rozmiaru elementów (mnożnik bazowego rozmiaru 3.75rem). */
export const ITEM_SCALE_MIN = 0.5
export const ITEM_SCALE_MAX = 3
export const ITEM_SCALE_STEP = 0.05
export const ITEM_SCALE_DEFAULT = 1.3

/** Orientacja kartki A4. */
export type PageOrientation = 'portrait' | 'landscape'

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
  {
    value: 'yesNo',
    label: 'Tak / Nie',
    description: 'Element z pytaniem i dwoma dużymi polami odpowiedzi.',
  },
  {
    value: 'oddOneOut',
    label: 'Co nie pasuje?',
    description: 'Kilka elementów, uczeń wskazuje ten niepasujący.',
  },
  {
    value: 'sequence',
    label: 'Sekwencja',
    description: 'Wzór z elementów powtórzony kilka razy + puste pola.',
  },
  {
    value: 'cutCards',
    label: 'Kartoniki do wycinania',
    description: 'Równe kartoniki w siatce, gotowe do wydruku i wycięcia.',
  },
  {
    value: 'sameOrDifferent',
    label: 'Taki sam / inny',
    description: 'Element wzorcowy i kilka odpowiedzi do porównania.',
  },
  {
    value: 'categorize',
    label: 'Podziel na kategorie',
    description: 'Elementy i 2–3 kategorie, do których należy je przyporządkować.',
  },
  {
    value: 'handwriting',
    label: 'Nauka pisania',
    description: 'Szkolna liniatura i wpisywanie tekstu po śladzie.',
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
  /** Unikalny identyfikator strony w projekcie */
  id?: string
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
  /** Rozmiar elementów (mnożnik) - globalny dla wszystkich szablonów, edytowalny suwakiem. */
  itemScale: number
  /** Orientacja strony A4 — wspólna dla wszystkich szablonów. */
  orientation: PageOrientation
  /** Tryb prosty: większe polecenie, elementy i odstępy, dla lepszej czytelności. */
  simpleMode: boolean
  /** Elementy tworzące wzór w szablonie „Sekwencja” (2-4 elementy). */
  sequenceItems: WorksheetItem[]
  /** Ile razy wzór ma się powtórzyć w szablonie „Sekwencja”. */
  sequenceRepetitions: number
  /** Liczba pustych pól na końcu sekwencji (1-3). */
  sequenceBlanks: number
  /** Nagłówek karty - wspólny dla wszystkich szablonów. */
  header: WorksheetHeader
  /** Czy pokazywać przerywaną ramkę wokół kartoników w szablonie „Kartoniki do wycinania”. */
  cutCardsShowBorder: boolean
  /** Nazwy kategorii (2 lub 3) dla szablonu „Podziel na kategorie”. */
  categories: string[]
  /** Liczba generowanych wariantów. */
  variantCount?: number
  /** Identyfikatory poprawnych odpowiedzi (dla Wybierz, Co nie pasuje, Taki sam/inny) lub "yes"/"no" (dla Tak/Nie) */
  correctAnswers?: string[]
  /** Tekst dla szablonu nauka pisania */
  handwritingText?: string
  /** Tryb linii dla szablonu nauka pisania */
  handwritingMode?: 'solid' | 'tracing' | 'empty'
  handwritingRepeat?: boolean
  handwritingFont?: string
}

/** Opcjonalny nagłówek drukowany na górze kartki: tytuł + pola do wpisania przez ucznia. */
export interface WorksheetHeader {
  /** Czy tytuł karty ma być pokazany. */
  showTitle: boolean
  title: string
  /** Czy pokazać pole na imię i nazwisko. */
  showName: boolean
  /** Etykieta pola - domyślnie "Imię i nazwisko", edytowalna. */
  nameLabel: string
  /** Czy pokazać pole na datę. */
  showDate: boolean
  dateLabel: string
  /** Czy pokazać pole na klasę. */
  showClass: boolean
  classLabel: string
}

export const DEFAULT_WORKSHEET_HEADER: WorksheetHeader = {
  showTitle: false,
  title: '',
  showName: false,
  nameLabel: 'Imię i nazwisko',
  showDate: false,
  dateLabel: 'Data',
  showClass: false,
  classLabel: 'Klasa',
}

/** Model reprezentujący cały projekt (wiele stron). */
export interface ProjectState {
  pages: WorksheetState[]
  activePageIndex: number
}
