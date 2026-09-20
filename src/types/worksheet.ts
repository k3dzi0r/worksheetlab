import type { MathMissing, MathOperation } from '../mathTasks'
import type { MazeCarver, MazeDeadEnds, MazeEnds } from '../maze'

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

export type TemplateType = 'choice' | 'matchPairs' | 'count' | 'yesNo' | 'sequence' | 'cutCards' | 'sameOrDifferent' | 'categorize' | 'handwriting' | 'wordSearch' | 'maze' | 'coloring' | 'math' | 'pattern' | 'crossword' | 'dotToDot' | 'clock'

/** Układ elementów w szablonie „Wybierz”. */
export type ChoiceLayout = 'row' | 'scattered'

/** Zakres płynnego suwaka rozmiaru elementów (mnożnik bazowego rozmiaru 3.75rem). */
export const ITEM_SCALE_MIN = 0.5
export const ITEM_SCALE_MAX = 3
export const ITEM_SCALE_STEP = 0.05
export const ITEM_SCALE_DEFAULT = 1.3

/** Orientacja kartki A4. */
export type PageOrientation = 'portrait' | 'landscape'

/** Kategorie w wyborze szablonu - przy osiemnastu kartach płaska lista była nie do przejrzenia. */
export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'language', label: 'Polski' },
  { value: 'math', label: 'Matematyka' },
  { value: 'writing', label: 'Pisanie' },
  { value: 'puzzles', label: 'Łamigłówki' },
  { value: 'pictures', label: 'Obrazkowe' },
] as const

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]['value']

export interface TemplateOption {
  value: TemplateType
  label: string
  description: string
  category: Exclude<TemplateCategory, 'all'>
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    value: 'wordSearch',
    label: 'Wykreślanka',
    description: 'Ukryte słowa w siatce liter z podpowiedziami.',
    category: 'language',
  },
  {
    value: 'maze',
    label: 'Labirynt',
    description: 'Droga od startu do mety, z kluczem odpowiedzi.',
    category: 'puzzles',
  },
  {
    value: 'coloring',
    label: 'Kolorowanka',
    description: 'Mandala do pokolorowania, także w wersji „koloruj według kodu”.',
    category: 'puzzles',
  },
  {
    value: 'math',
    label: 'Działania',
    description: 'Dodawanie, odejmowanie, mnożenie i dzielenie z kluczem odpowiedzi.',
    category: 'math',
  },
  {
    value: 'pattern',
    label: 'Szlaczki',
    description: 'Wzory grafomotoryczne do wodzenia ołówkiem, po śladzie i samodzielnie.',
    category: 'writing',
  },
  {
    value: 'crossword',
    label: 'Krzyżówka',
    description: 'Hasło w kolumnie, definicje pod spodem, klucz odpowiedzi.',
    category: 'language',
  },
  {
    value: 'dotToDot',
    label: 'Połącz kropki',
    description: 'Numerowane kropki układają się w obrazek do odkrycia.',
    category: 'writing',
  },
  {
    value: 'clock',
    label: 'Zegar',
    description: 'Odczytywanie godziny i rysowanie wskazówek, z kluczem odpowiedzi.',
    category: 'math',
  },
  {
    value: 'choice',
    label: 'Wybierz',
    description: 'Polecenie i kilka obrazów/emoji do wyboru.',
    category: 'pictures',
  },
  {
    value: 'matchPairs',
    label: 'Połącz w pary',
    description: 'Dwie kolumny elementów do połączenia liniami.',
    category: 'pictures',
  },
  {
    value: 'count',
    label: 'Policz',
    description: 'Jeden element powtórzony wielokrotnie + pole na odpowiedź.',
    category: 'math',
  },
  {
    value: 'yesNo',
    label: 'Tak / Nie',
    description: 'Element z pytaniem i dwoma dużymi polami odpowiedzi.',
    category: 'pictures',
  },
  {
    value: 'sequence',
    label: 'Sekwencja',
    description: 'Wzór z elementów powtórzony kilka razy + puste pola.',
    category: 'puzzles',
  },
  {
    value: 'cutCards',
    label: 'Kartoniki do wycinania',
    description: 'Równe kartoniki w siatce, gotowe do wydruku i wycięcia.',
    category: 'pictures',
  },
  {
    value: 'sameOrDifferent',
    label: 'Taki sam / inny',
    description: 'Element wzorcowy i kilka odpowiedzi do porównania.',
    category: 'puzzles',
  },
  {
    value: 'categorize',
    label: 'Podziel na kategorie',
    description: 'Elementy i 2–3 kategorie, do których należy je przyporządkować.',
    category: 'pictures',
  },
  {
    value: 'handwriting',
    label: 'Nauka pisania',
    description: 'Szkolna liniatura i wpisywanie tekstu po śladzie.',
    category: 'writing',
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
  /** Unikalny identyfikator zadania w obrębie strony projektu. */
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
  /** Skala wielkości polecenia (np. 1.0 = domyślny rozmiar) */
  instructionScale: number
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
  /** Tak/Nie: czy używać kolorów dla kciuków (zielony/czerwony) */
  yesNoUseColors?: boolean
  /** Wybierz: czy pokazywać puste kratki na odpowiedzi obok obrazków */
  choiceShowCheckboxes?: boolean
  /** Połącz w pary: styl linii */
  matchPairsLineStyle?: 'solid' | 'dashed' | 'dotted'
  /** Policz: czy elementy mają być rozrzucone (scattered) */
  countScattered?: boolean
  /** Sekwencja: styl pustych pól (underscore lub box) */
  sequenceBlankStyle?: 'underscore' | 'box'
  /** Kartoniki do wycinania: liczba kartoników w rzędzie (domyślnie 3) */
  cutCardsPerRow?: number
  /** Taki sam/inny: styl wyróżnienia wzorca */
  sameOrDifferentReferenceStyle?: 'box' | 'underline' | 'none'
  /** Podziel na kategorie: tryb graficzny */
  categorizeLayout?: 'columns' | 'areas'
  variantCount?: number
  /** Identyfikatory poprawnych odpowiedzi (dla Wybierz, Co nie pasuje, Taki sam/inny) lub "yes"/"no" (dla Tak/Nie) */
  correctAnswers?: string[]
  /** Tekst dla szablonu nauka pisania */
  handwritingText?: string
  /** Tryb linii dla szablonu nauka pisania */
  handwritingMode?: 'solid' | 'tracing' | 'empty'
  handwritingRepeat?: boolean
  handwritingFont?: string
  /** Jak ciemny jest ślad do obrysowania. */
  handwritingTrace?: 'light' | 'medium' | 'dark'
  /** Co pokazuje liniatura: pełne linie, samą podstawową albo nic. */
  handwritingGuides?: 'full' | 'baseline' | 'none'
  /** Czy zostawiać co drugi wiersz pusty na samodzielne pisanie. */
  handwritingEveryOther?: boolean
  /** Czy zaznaczyć kropką miejsce startu wiersza. */
  handwritingStartDot?: boolean
  /** Rodzaj ćwiczenia z zegarem. */
  clockMode?: 'read' | 'draw' | 'mixed'
  /** Z jaką dokładnością losowane są godziny. */
  clockPrecision?: 'hour' | 'half' | 'quarter' | 'five' | 'minute'
  /** Zapis 24-godzinny zamiast 12-godzinnego. */
  clockFormat24?: boolean
  /** Które cyfry są na tarczy. */
  clockDial?: 'all' | 'quarters' | 'none'
  /** Czy rysować kreski minutowe. */
  clockMinuteTicks?: boolean
  /** Obrazek w „Połącz kropki" albo „random" - inny w każdym wariancie. */
  dotShape?: string
  /** Liczba kropek na konturze. */
  dotCount?: number
  /** Sposób numerowania kropek. */
  dotNumbering?: 'numbers' | 'evens' | 'backwards' | 'letters'
  /** Czy pokazać blady kontur jako podpowiedź. */
  dotShowOutline?: boolean
  /** Słowa krzyżówki w formacie „słowo - definicja", jedno w wierszu. */
  crosswordWords?: string
  /** Hasło do odczytania w kolumnie. Puste oznacza dobór liter losowo. */
  crosswordKeyword?: string
  /** Czy drukować definicje pod krzyżówką. */
  crosswordShowClues?: boolean
  /** Czy numerować wiersze krzyżówki. */
  crosswordNumbers?: boolean
  /** Wzór szlaczka albo „mixed" - inny w każdym wierszu. */
  patternId?: string
  /** Ile wiersza zajmuje gotowy wzór i ślad do obrysowania. */
  patternHelp?: string
  /** Płynna długość wzoru i śladu w wierszu, w procentach. */
  patternLength?: number
  /** Czy rysować linie pomocnicze nad i pod szlaczkiem. */
  patternGuides?: boolean
  /** Czy zaznaczyć kropką miejsce startu. */
  patternStartDot?: boolean
  /** Rodzaje działań w szablonie „Działania”. */
  mathOperations?: MathOperation[]
  /** Górna granica zakresu liczbowego (10, 20, 100). */
  mathMax?: number
  /** Czy wolno przekraczać próg dziesiątkowy. */
  mathCrossTen?: boolean
  /** Które miejsce w działaniu zostaje puste. */
  mathMissing?: MathMissing
  /** Złożoność wzoru kolorowanki (1-5). */
  coloringLevel?: number
  /** Zwykła kolorowanka albo kolorowanie według kodu (numer w każdym polu). */
  coloringMode?: 'blank' | 'numbers'
  /** Liczba kolorów w legendzie przy kolorowaniu według kodu. */
  coloringColorCount?: number
  /** Liczba osi symetrii wzoru. 0 oznacza „losuj". */
  coloringSectors?: number
  /** Wykończenie krawędzi mandali. */
  coloringCrown?: 'auto' | 'scallop' | 'petal' | 'points' | 'none'
  /** Mnożnik grubości konturu (0,7 - 1,6). */
  coloringStroke?: number
  /** Poziom trudności labiryntu (1-5). */
  mazeLevel?: number
  /** Sposób drążenia korytarzy. */
  mazeCarver?: MazeCarver
  /** Ile ślepych uliczek zostaje w labiryncie. */
  mazeDeadEnds?: MazeDeadEnds
  /** Gdzie wypadają start i meta. */
  mazeEnds?: MazeEnds
  /** Opcje wykreślanki */
  /** Słowa do ukrycia - jedno w wierszu (dopuszczalne też przecinki/średniki). */
  wordSearchWords?: string
  wordSearchGridSize?: number
  wordSearchAllowHorizontal?: boolean
  wordSearchAllowVertical?: boolean
  wordSearchAllowDiagonals?: boolean
  wordSearchAllowReverse?: boolean
  wordSearchUppercase?: boolean
  /** Siatka kwadratowa albo dociągnięta do proporcji kartki. */
  wordSearchShape?: 'square' | 'page'
  /** Czy pod siatką drukować listę ukrytych słów. */
  wordSearchShowWords?: boolean
  /** Czym wypełniać puste pola: losowymi literami czy literami z ukrytych słów. */
  wordSearchFiller?: 'random' | 'fromWords'
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

/** Jedna fizyczna strona A4, zawierająca od jednego do czterech niezależnych zadań. */
export interface WorksheetPage {
  /** Stabilny identyfikator strony wykorzystywany przez PageManager. */
  id: string
  /** Ustawienia wspólne dla wszystkich zadań na tej stronie. */
  orientation: PageOrientation
  header: WorksheetHeader
  variantCount: number
  tasks: WorksheetState[]
}

/** Model reprezentujący cały projekt (wiele stron A4). */
export interface ProjectState {
  pages: WorksheetPage[]
  activePageIndex: number
  activeTaskIndex: number
  showPageNumbers?: boolean
  /** Czy drukować dyskretny podpis KartoLabu na każdej stronie. */
  showBranding?: boolean
}
