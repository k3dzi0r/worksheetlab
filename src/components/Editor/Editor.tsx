import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  WorksheetItem,
  WorksheetState,
  TemplateType,
  ChoiceLayout,
  PageOrientation,
  WorksheetHeader,
} from '../../types/worksheet'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TEMPLATE_OPTIONS, TEMPLATE_CATEGORIES, ITEM_SCALE_MIN, ITEM_SCALE_MAX, ITEM_SCALE_STEP, ANSWER_KEY_TEMPLATES, SHUFFLEABLE_TEMPLATES } from '../../types/worksheet'
import type { TemplateCategory, StepRequest } from '../../types/worksheet'
import { TemplateThumbnail } from './TemplateThumbnail'
import { ImageUploader } from '../ImageUploader/ImageUploader'
import { EmojiPicker } from '../EmojiPicker/EmojiPicker'
import { MyLibrary } from '../MyLibrary/MyLibrary'
import type { EmojiEntry } from '../../data/emojis'
import { createId } from '../../utils'
import { WORKSHEET_EXAMPLES } from '../../examples'
import type { WorksheetExample } from '../../examples'
import { generateWordSearch, parseWords } from '../../wordSearch'
import { buildCrossword, parseCrosswordLines } from '../../crossword'
import { DOT_NUMBERING, DOT_SHAPES } from '../../dotToDot'
import { CLOCK_PRECISIONS } from '../../clockTasks'
import { CLOCK_DIALS } from '../../templates/ClockTemplate'
import { DEFAULT_HANDWRITING_FONT, HANDWRITING_FONTS, getHandwritingFont } from '../../handwritingFonts'
import { MAZE_LEVELS, getMazeLevel } from '../../maze'
import type { MazeCarver, MazeDeadEnds, MazeEnds } from '../../maze'

const MAZE_CARVERS: { value: MazeCarver; label: string }[] = [
  { value: 'random', label: 'Losowo' },
  { value: 'winding', label: 'Kręte' },
  { value: 'branching', label: 'Rozgałęzione' },
]

const MAZE_DEAD_ENDS: { value: MazeDeadEnds; label: string }[] = [
  { value: 'many', label: 'Dużo' },
  { value: 'few', label: 'Mało' },
  { value: 'none', label: 'Brak' },
]

const MAZE_ENDS: { value: MazeEnds; label: string }[] = [
  { value: 'random', label: 'Losowo' },
  { value: 'corners', label: 'W rogach' },
  { value: 'edges', label: 'Na krawędziach' },
]
import { COLORING_LEVELS, COLOR_COUNT_MAX, COLOR_COUNT_MIN, getColoringLevel } from '../../coloring'
import type { CrownStyle } from '../../coloring'

const COLORING_CROWNS: { value: CrownStyle; label: string }[] = [
  { value: 'auto', label: 'Losowo' },
  { value: 'scallop', label: 'Ząbki' },
  { value: 'petal', label: 'Płatki' },
  { value: 'points', label: 'Kolce' },
  { value: 'none', label: 'Gładka' },
]
import { MATH_OPERATION_LABELS, MATH_OPERATION_SIGNS } from '../../mathTasks'
import { PATTERNS } from '../../patterns'
import { PATTERN_LENGTH_MAX, PATTERN_LENGTH_MIN } from '../../templates/PatternTemplate'
import { GUIDE_LEVELS, TRACE_LEVELS } from '../../templates/HandwritingTemplate'
import type { MathOperation } from '../../mathTasks'
import { SupportPopover } from '../SupportPopover'

/** Przełącza rodzaj działania, ale nie pozwala odznaczyć ostatniego - karta nie może być pusta. */
function toggleMathOperation(current: MathOperation[] | undefined, operation: MathOperation): MathOperation[] {
  const operations = current && current.length > 0 ? current : (['add'] as MathOperation[])
  if (!operations.includes(operation)) return [...operations, operation]
  const remaining = operations.filter((op) => op !== operation)
  return remaining.length > 0 ? remaining : operations
}

/** Usuwa rozszerzenie pliku (np. ".png"), żeby zaproponować czytelną nazwę jako podpis. */
function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, '')
}

interface CrosswordEditorRow {
  word: string
  clue: string
}

/** Rozdziela zapis tekstowy projektu na dwa jawne pola edytora. */
function parseCrosswordEditorRows(text: string): CrosswordEditorRow[] {
  if (text.length === 0) return [{ word: '', clue: '' }]
  return text.split('\n').map((line) => {
    const separator = line.match(/\s[-–—]\s|;|\t/)
    if (!separator || separator.index === undefined) return { word: line, clue: '' }
    const clueStart = separator.index + separator[0].length
    return { word: line.slice(0, separator.index), clue: line.slice(clueStart) }
  })
}

function serializeCrosswordEditorRows(rows: CrosswordEditorRow[]): string {
  return rows.map((row) => (row.clue ? `${row.word} - ${row.clue}` : row.word)).join('\n')
}

// Kolejność w tabach - id odpowiada konkretnemu blokowi <Step step={id}> niżej w pliku,
// więc kolejność wyświetlania i numer id celowo się rozjeżdżają (Edycja jest druga, ale
// zostaje przy id=3, żeby nie ruszać całego bloku JSX pod nią).
// `icon` to ścieżki SVG (viewBox 24) dla dolnego paska na telefonie.
const STEPS = [
  { id: 1, title: 'Szablon', hint: 'Wybierz typ karty', icon: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'] },
  { id: 3, title: 'Edycja', hint: 'Treść i elementy karty', icon: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'] },
  { id: 2, title: 'Układ', hint: 'Orientacja, rozmiar, warianty', icon: ['M4 3h16v18H4z', 'M4 9h16', 'M12 9v12'] },
  { id: 5, title: 'Nagłówek', hint: 'Tytuł i dane ucznia', icon: ['M4 6h16', 'M4 11h10', 'M4 16h7'] },
] as const

/** Krok "Więcej" - tylko na telefonie; zbiera to, co na komputerze siedzi w panelu kroków. */
const MORE_STEP = { id: 6, title: 'Więcej', hint: 'Opcje, plik, wsparcie', icon: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'] } as const

/** Krok "Edycja" - id zdefiniowane wyżej w STEPS, nazwane żeby nie rozjechać się przy zmianach kolejności. */
const EDIT_STEP_ID = 3

/** Treść jednego kroku; niewidoczne kroki nie są renderowane. */
function Step({ step, active, children }: { step: number; active: number; children: React.ReactNode }) {
  if (step !== active) return null
  return <div className="flex flex-col gap-4">{children}</div>
}


interface EditorProps {
  stepRequest?: StepRequest | null
  onShuffle: () => void
  onApplyExample: (example: WorksheetExample) => void
  showAnswerKey: boolean
  onToggleAnswerKey: () => void
  showPageNumbers: boolean
  onTogglePageNumbers: () => void
  showBranding: boolean
  onToggleBranding: () => void
  onImport: (text: string) => void
  onExport: () => void
  onClear: () => void
  onToggleCorrectAnswer?: (answerId: string) => void
  worksheet: WorksheetState
  tasks: WorksheetState[]
  activeTaskIndex: number
  onSelectTask: (index: number) => void
  onAddTask: () => void
  onRemoveTask: (index: number) => void
  onTemplateChange: (template: TemplateType) => void
  onHandwritingTextChange: (text: string) => void
  onHandwritingModeChange: (mode: 'solid' | 'tracing' | 'empty') => void
  onHandwritingRepeatChange: (repeat: boolean) => void
  onHandwritingFontChange: (font: string) => void
  onWordSearchOptionsChange: (options: Partial<WorksheetState>) => void
  onMazeLevelChange: (level: number) => void
  onMazeOptionsChange: (options: Partial<WorksheetState>) => void
  onColoringOptionsChange: (options: Partial<WorksheetState>) => void
  onMathOptionsChange: (options: Partial<WorksheetState>) => void
  onPatternOptionsChange: (options: Partial<WorksheetState>) => void
  onHandwritingOptionsChange: (options: Partial<WorksheetState>) => void
  onCrosswordOptionsChange: (options: Partial<WorksheetState>) => void
  onDotOptionsChange: (options: Partial<WorksheetState>) => void
  onClockOptionsChange: (options: Partial<WorksheetState>) => void
  onInstructionChange: (instruction: string) => void
  onUpdateOptions: (options: Partial<WorksheetState>) => void
  onCountRepetitionsChange: (count: number) => void
  onLayoutChange: (layout: ChoiceLayout) => void
  onItemScaleChange: (itemScale: number) => void
  onUpdateItemScale: (id: string, scale: number) => void
  onResetItemScale: (id: string) => void
  onResetAllItemScales: () => void
  onOrientationChange: (orientation: PageOrientation) => void
  onHeaderChange: (header: Partial<WorksheetHeader>) => void
  onCutCardsShowBorderChange: (showBorder: boolean) => void
  onSequenceRepetitionsChange: (count: number) => void
  onSequenceBlanksChange: (count: number) => void
  onCategoriesChange: (categories: string[]) => void
  onVariantCountChange: (count: number) => void
  onAddItem: (item: WorksheetItem) => void
  onRemoveItem: (id: string) => void
  onDuplicateItem: (id: string) => void
  onMoveItem: (id: string, direction: 'up' | 'down') => void
  onUpdateCaption: (id: string, caption: string) => void
  onToggleCaption: (id: string) => void
  onReorderItems: (activeId: string, overId: string) => void
}

/** Lewy panel edycji: wybór szablonu, treść polecenia, dodawanie elementów, lista elementów. */
export function Editor({
  showAnswerKey,
  onToggleAnswerKey,
  showPageNumbers,
  onTogglePageNumbers,
  showBranding,
  onToggleBranding,
  onImport,
  onExport,
  onClear,
  worksheet,
  tasks,
  activeTaskIndex,
  onSelectTask,
  onAddTask,
  onRemoveTask,
  onTemplateChange,
  onHandwritingTextChange,
  onHandwritingModeChange,
  onHandwritingRepeatChange,
  onHandwritingFontChange,
  onWordSearchOptionsChange,
  onMazeLevelChange,
  onMazeOptionsChange,
  onColoringOptionsChange,
  onMathOptionsChange,
  onPatternOptionsChange,
  onHandwritingOptionsChange,
  onCrosswordOptionsChange,
  onDotOptionsChange,
  onClockOptionsChange,
  onInstructionChange,
  onUpdateOptions,
  onCountRepetitionsChange,
  onLayoutChange,
  onItemScaleChange,
  onUpdateItemScale,
  onResetItemScale,
  onResetAllItemScales,
  onOrientationChange,
  onHeaderChange,
  onCutCardsShowBorderChange,
  onSequenceRepetitionsChange,
  onSequenceBlanksChange,
  onCategoriesChange,
  onVariantCountChange,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onMoveItem,
  onUpdateCaption,
  onToggleCaption,
  onReorderItems,
  onToggleCorrectAnswer,
  stepRequest,
  onShuffle,
  onApplyExample,
}: EditorProps) {
  const [activeStep, setActiveStep] = useState(1)
  // Na telefonie treść kroku to arkusz nad dolnym paskiem - na komputerze te flagi nic nie zmieniają.
  const [isSheetOpen, setIsSheetOpen] = useState(worksheet.template === null)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false)
  // Nowa strona/zadanie zawsze zaczyna bez szablonu - wraca na krok wyboru zamiast zostawiać
  // otwarty krok z poprzedniego zadania.
  useEffect(() => {
    if (worksheet.template === null) {
      setActiveStep(1)
      setIsSheetOpen(true)
    }
  }, [worksheet.id, worksheet.template])

  useEffect(() => {
    if (!stepRequest) return
    setActiveStep(stepRequest.step === 'template' ? 1 : EDIT_STEP_ID)
    setIsSheetOpen(true)
  }, [stepRequest])

  const hasAnswerKey = worksheet.template !== null && ANSWER_KEY_TEMPLATES.includes(worksheet.template)
  const canShuffle = worksheet.template !== null && SHUFFLEABLE_TEMPLATES.includes(worksheet.template)

  function selectStep(stepId: number) {
    // Ponowne kliknięcie aktywnego kroku chowa arkusz, żeby obejrzeć całą kartę.
    setIsSheetOpen(stepId !== activeStep || !isSheetOpen)
    setActiveStep(stepId)
  }
  const activeStepInfo = [...STEPS, MORE_STEP].find((step) => step.id === activeStep) ?? STEPS[0]
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const [isContentCollapsed, setIsContentCollapsed] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('all')
  const visibleTemplates = useMemo(
    () =>
      templateCategory === 'all'
        ? TEMPLATE_OPTIONS
        : TEMPLATE_OPTIONS.filter((option) => option.category === templateCategory),
    [templateCategory],
  )

  const [showLibrary, setShowLibrary] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handwritingTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Ostrzeżenie w edytorze: do których liter hasła zabrakło słowa.
  const crosswordSkipped = useMemo(() => {
    if (worksheet.template !== 'crossword') return []
    return buildCrossword(parseCrosswordLines(worksheet.crosswordWords || ''), {
      keyword: worksheet.crosswordKeyword || '',
      seed: 1,
    }).missingLetters
  }, [worksheet.template, worksheet.crosswordWords, worksheet.crosswordKeyword])

  const crosswordEditorRows = useMemo(
    () => parseCrosswordEditorRows(worksheet.crosswordWords || ''),
    [worksheet.crosswordWords],
  )

  // Ostrzeżenie w edytorze: które słowa nie zmieściły się w siatce wykreślanki.
  const wordSearchSkipped = useMemo(() => {
    if (worksheet.template !== 'wordSearch') return []
    const size = worksheet.wordSearchGridSize || 10
    return generateWordSearch(parseWords(worksheet.wordSearchWords || ''), {
      cols: size,
      rows: size,
      allowHorizontal: worksheet.wordSearchAllowHorizontal ?? true,
      allowVertical: worksheet.wordSearchAllowVertical ?? true,
      allowDiagonals: worksheet.wordSearchAllowDiagonals ?? false,
      allowReverse: worksheet.wordSearchAllowReverse ?? false,
      filler: 'random',
      seed: 1,
    }).skipped
  }, [
    worksheet.template,
    worksheet.wordSearchWords,
    worksheet.wordSearchGridSize,
    worksheet.wordSearchAllowHorizontal,
    worksheet.wordSearchAllowVertical,
    worksheet.wordSearchAllowDiagonals,
    worksheet.wordSearchAllowReverse,
  ])

  const insertHandwritingTag = (tag: string) => {
    const el = handwritingTextareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = worksheet.handwritingText || ''
    const before = text.substring(0, start)
    const selected = text.substring(start, end)
    const after = text.substring(end)
    const newText = before + `[${tag}]` + selected + `[/${tag}]` + after
    onHandwritingTextChange(newText)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + 3, end + 3)
    }, 0)
  }

  function handleImageSelected(dataUrl: string, fileName: string) {
    // Podpis jest od razu proponowany na podstawie nazwy pliku - użytkownik może go dowolnie zmienić.
    const caption = stripFileExtension(fileName)
    onAddItem({ id: createId(), source: 'image', imageDataUrl: dataUrl, label: fileName, caption, showCaption: false })
  }

  function updateCrosswordRow(index: number, field: keyof CrosswordEditorRow, value: string) {
    const rows = crosswordEditorRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    )
    onCrosswordOptionsChange({ crosswordWords: serializeCrosswordEditorRows(rows) })
  }

  function addCrosswordRow() {
    onCrosswordOptionsChange({
      crosswordWords: serializeCrosswordEditorRows([...crosswordEditorRows, { word: '', clue: '' }]),
    })
  }

  function removeCrosswordRow(index: number) {
    const rows = crosswordEditorRows.filter((_, rowIndex) => rowIndex !== index)
    onCrosswordOptionsChange({ crosswordWords: serializeCrosswordEditorRows(rows) })
  }

  function updateWordSearchDirection(
    field: 'wordSearchAllowHorizontal' | 'wordSearchAllowVertical' | 'wordSearchAllowDiagonals',
    checked: boolean,
  ) {
    const next = {
      wordSearchAllowHorizontal: worksheet.wordSearchAllowHorizontal ?? true,
      wordSearchAllowVertical: worksheet.wordSearchAllowVertical ?? true,
      wordSearchAllowDiagonals: worksheet.wordSearchAllowDiagonals ?? false,
      [field]: checked,
    }
    if (!next.wordSearchAllowHorizontal && !next.wordSearchAllowVertical && !next.wordSearchAllowDiagonals) return
    onWordSearchOptionsChange({ [field]: checked })
  }

  function handleEmojiSelected(entry: EmojiEntry) {
    // Podpis jest od razu proponowany na podstawie polskiej nazwy emoji - można go zmienić.
    onAddItem({ id: createId(), source: 'emoji', emoji: entry.emoji, label: entry.name, caption: entry.name, showCaption: false })
  }

  // Szybkie opcje, plik i wsparcie: na komputerze w panelu kroków, na telefonie w kroku "Więcej".
  const extras = (
    <>
        {/* Sekcja "Szybkie opcje" */}
        <div className="mt-6 px-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Szybkie opcje</h2>
          <div className="flex flex-col gap-2">
            <Toggle label="Numery stron" checked={showPageNumbers} onChange={onTogglePageNumbers} />
            <Toggle label="Dodaj podpis KartoLabu" checked={showBranding} onChange={onToggleBranding} />
          </div>
        </div>

        {/* Sekcja "Dodatkowe działania" */}
        <div className="mt-6 px-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dodatkowe działania</h2>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-indigo-50 text-indigo-700 cursor-pointer hover:bg-indigo-100 transition-colors text-center h-[72px]">
              <input type="file" accept="application/json" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => onImport(ev.target?.result as string)
                  reader.readAsText(file)
                }
                e.target.value = ''
              }} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="text-[10px] leading-tight font-medium">Wczytaj<br/>z pliku</span>
            </label>
            <button type="button" onClick={onExport} className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-center h-[72px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[10px] leading-tight font-medium">Eksportuj<br/>projekt</span>
            </button>
            <button type="button" onClick={() => {
              if (window.confirm('Czy na pewno chcesz usunąć całą zawartość?')) {
                onClear()
              }
            }} className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-center h-[72px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span className="text-[10px] leading-tight font-medium">Wyczyść<br/>wszystko</span>
            </button>
          </div>
        </div>

        <div className="editor-sidebar-support mt-6 mx-3 shrink-0">
          <div className="editor-sidebar-support-copy">
            <span aria-hidden="true">☕</span>
            <div>
              <h3>Wspieraj rozwój KartoLabu</h3>
              <p>KartoLab powstaje dzięki wsparciu użytkowników. Jeśli lubisz to narzędzie, postaw mi wirtualną kawę!</p>
            </div>
          </div>
          <SupportPopover />
        </div>
    </>
  )

  return (
    <div className="editor-shell">
      <nav className={`step-nav relative transition-all duration-300 ease-in-out ${isNavCollapsed ? '!w-16 !px-0 border-r-0' : ''}`}>
        <button
          type="button"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          aria-label={isNavCollapsed ? 'Rozwiń nawigację' : 'Zwiń nawigację'}
          title={isNavCollapsed ? 'Rozwiń nawigację' : 'Zwiń nawigację'}
          className={`desktop-collapse-toggle absolute top-3 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm z-50 text-gray-500 hover:text-gray-700 hover:bg-gray-50 hidden md:block ${isNavCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-3'}`}
        >
          <svg className={`w-4 h-4 transform transition-transform ${isNavCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="step-nav-inner custom-scrollbar h-full flex flex-col">
        <header className="mb-5 px-4 pr-12 flex items-center gap-2">
          <img
            src={`${import.meta.env.BASE_URL}illustrations/worksheet-icon.png`}
            alt=""
            aria-hidden="true"
            className={`w-10 h-10 object-contain shrink-0 transition-opacity ${isNavCollapsed ? 'opacity-0' : 'opacity-100'}`}
          />
          <div>
            <h1 className={`text-xl font-bold text-gray-900 transition-opacity ${isNavCollapsed ? 'opacity-0 whitespace-nowrap' : 'opacity-100'}`}>KartoLab</h1>
            <p className={`text-gray-500 text-xs transition-opacity ${isNavCollapsed ? 'opacity-0 whitespace-nowrap' : 'opacity-100'}`}>Kreator kart pracy A4</p>
          </div>
        </header>

        <ol className="flex flex-col gap-2 px-2">
          {[...STEPS, MORE_STEP].map((step, index) => {
            const active = activeStep === step.id
            return (
              <li key={step.id} className={step.id === MORE_STEP.id ? 'step-nav-more' : undefined}>
                <button
                  type="button"
                  onClick={() => selectStep(step.id)}
                  aria-current={active ? 'step' : undefined}
                  className={`step-nav-button w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    active
                      ? 'is-active bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${isNavCollapsed ? 'justify-center' : ''}`}
                >
                  <span
                    className={`step-nav-number flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold shrink-0 ${
                      active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <svg className="step-nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {step.icon.map((d) => <path key={d} d={d} />)}
                  </svg>
                  {!isNavCollapsed && (
                  <span className="step-nav-text min-w-0">
                    <span className={`step-nav-title block text-sm font-semibold ${active ? 'text-blue-800' : 'text-gray-900'}`}>
                      {step.title}
                    </span>
                    <span className="step-nav-hint block text-xs text-gray-500 truncate">{step.hint}</span>
                  </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>

        <div className={`step-nav-extras ${isNavCollapsed ? 'hidden' : ''}`}>{extras}</div>


        <div className={`editor-sidebar-footer mt-auto px-4 pt-4 shrink-0 flex flex-col justify-end transition-opacity ${isNavCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
          <img
            src={`${import.meta.env.BASE_URL}illustrations/school-supplies.png`}
            alt=""
            aria-hidden="true"
            className="w-full h-20 object-contain mb-2 select-none"
          />
          <p className="text-xs font-medium text-gray-700 text-center mb-1">
            ❤️ Tworzone z myślą o nauczycielach
          </p>
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Wszystko liczy się na Twoim komputerze. Karty nie są nigdzie wysyłane.
          </p>
        </div>
        </div>
      </nav>

      <div
        id="editor-step-sheet"
        className={`step-content relative transition-all duration-300 ease-in-out bg-white ${isContentCollapsed ? '!w-11 border-none' : ''} ${
          isSheetOpen ? 'is-sheet-open' : ''
        } ${isSheetExpanded ? 'is-sheet-expanded' : ''}`}
      >
        {/* Nagłówek arkusza - widoczny tylko na telefonie. */}
        <div className="step-sheet-header">
          <button
            type="button"
            className="step-sheet-handle"
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
            aria-label={isSheetExpanded ? 'Zmniejsz panel' : 'Powiększ panel'}
          />
          <div className="step-sheet-title">
            <h2>{activeStepInfo.title}</h2>
            <p>{activeStepInfo.hint}</p>
          </div>
          <button type="button" className="step-sheet-done" onClick={() => setIsSheetOpen(false)}>
            Gotowe
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsContentCollapsed(!isContentCollapsed)}
          aria-label={isContentCollapsed ? 'Rozwiń ustawienia' : 'Zwiń ustawienia'}
          title={isContentCollapsed ? 'Rozwiń ustawienia' : 'Zwiń ustawienia'}
          className="desktop-collapse-toggle absolute top-3 right-2 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm z-50 text-gray-500 hover:text-gray-700 hover:bg-gray-50 hidden md:block"
        >
          <svg className={`w-4 h-4 transform transition-transform ${isContentCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={`step-sheet-body w-[392px] max-w-[100vw] h-full overflow-y-auto px-6 pb-6 pt-14 transition-opacity duration-200 ${isContentCollapsed ? 'opacity-0 invisible' : 'opacity-100'}`}>

      <Step step={1} active={activeStep}>
      {tasks.length > 1 && (
        <TaskStrip
          tasks={tasks}
          activeTaskIndex={activeTaskIndex}
          onSelectTask={onSelectTask}
          onAddTask={onAddTask}
          onRemoveTask={onRemoveTask}
        />
      )}

      {/* Gotowe przykłady - pełna karta jednym kliknięciem, do przerobienia po swojemu */}
      {worksheet.template === null && (
        <section>
          <h2 className="text-lg font-semibold">Zacznij od przykładu</h2>
          <p className="text-xs text-gray-500 mb-2">Gotowa karta, którą potem zmienisz po swojemu.</p>
          <div className="grid grid-cols-2 gap-2">
            {WORKSHEET_EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => {
                  onApplyExample(example)
                  setActiveStep(EDIT_STEP_ID)
                }}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white text-left hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="text-2xl leading-none" aria-hidden="true">{example.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900 leading-tight">{example.title}</span>
                  <span className="block text-[11px] text-gray-500 truncate">
                    {TEMPLATE_OPTIONS.find((option) => option.value === example.template)?.label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

{/* Wybór szablonu */}
      <section>
        <h2 className="text-lg font-semibold mb-2">{worksheet.template === null ? 'Albo wybierz pustą kartę' : 'Wybierz typ karty'}</h2>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setTemplateCategory(category.value)}
              className={`px-2.5 py-1 text-xs rounded-full border ${
                templateCategory === category.value
                  ? 'bg-blue-600 border-blue-600 text-white font-medium'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {visibleTemplates.map((option) => {
            const active = worksheet.template === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  // Zmiana szablonu czyści treść zadania - przy wypełnionym pytamy, żeby nie zniknęła przypadkiem.
                  if (
                    worksheet.template !== null &&
                    worksheet.template !== option.value &&
                    !window.confirm('Zmiana typu karty usunie treść tego zadania. Kontynuować? (Można to cofnąć)')
                  ) {
                    return
                  }
                  if (worksheet.template !== option.value) onTemplateChange(option.value)
                  setActiveStep(EDIT_STEP_ID)
                }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${
                  active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="w-full aspect-square max-h-24 rounded bg-gray-50 p-1">
                  <TemplateThumbnail template={option.value} />
                </span>
                <span
                  className={`text-sm text-center leading-tight ${active ? 'text-blue-700 font-semibold' : 'text-gray-800 font-medium'}`}
                >
                  {option.label}
                </span>
                <span className="text-[11px] text-center leading-snug text-gray-500 line-clamp-2">{option.description}</span>
              </button>
            )
          })}
        </div>
      </section>
</Step>

<Step step={2} active={activeStep}>

      {/* Orientacja strony - wspólna dla wszystkich szablonów */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Orientacja kartki</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOrientationChange('portrait')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium ${
              worksheet.orientation === 'portrait'
                ? 'border-blue-600 bg-blue-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            Pionowa
          </button>
          <button
            type="button"
            onClick={() => onOrientationChange('landscape')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium ${
              worksheet.orientation === 'landscape'
                ? 'border-blue-600 bg-blue-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            Pozioma
          </button>
        </div>
      </section>

{/* Kategorie - tylko dla szablonu "Podziel na kategorie" */}
      {worksheet.template === 'categorize' && (
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Kategorie</h2>
            <button
              type="button"
              onClick={() => {
                if (worksheet.categories.length === 2) {
                  onCategoriesChange([...worksheet.categories, 'Kategoria 3'])
                } else {
                  onCategoriesChange(worksheet.categories.slice(0, 2))
                }
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {worksheet.categories.length === 2 ? '+ Dodaj trzecią kategorię' : '- Usuń trzecią kategorię'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {worksheet.categories.map((cat, i) => (
              <input
                key={i}
                type="text"
                value={cat}
                onChange={(e) => {
                  const newCats = [...worksheet.categories]
                  newCats[i] = e.target.value
                  onCategoriesChange(newCats)
                }}
                placeholder={`Nazwa kategorii ${i + 1}`}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            ))}
          </div>
        </section>
      )}

      {/* Liczba powtórzeń - tylko dla szablonu "Policz" */}
      {worksheet.template === 'count' && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Liczba powtórzeń</h2>
          <input
            type="number"
            min={1}
            max={10}
            value={worksheet.countRepetitions}
            onChange={(event) => {
              const value = Math.min(10, Math.max(1, Number(event.target.value) || 1))
              onCountRepetitionsChange(value)
            }}
            className="w-24 border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
        </section>
      )}

      {/* Ramka wokół kartoników - tylko dla szablonu "Kartoniki do wycinania" */}
      {worksheet.template === 'cutCards' && (
        <section>
          <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={worksheet.cutCardsShowBorder}
              onChange={(event) => onCutCardsShowBorderChange(event.target.checked)}
              className="w-5 h-5"
            />
            <span>
              <span className="font-semibold text-gray-900">Ramka wokół kartoników</span>
              <span className="block text-sm text-gray-500">Przerywana linia ułatwiająca wycinanie.</span>
            </span>
          </label>
        </section>
      )}

      {/* Ustawienia wzoru - tylko dla szablonu "Sekwencja" */}
      {worksheet.template === 'sequence' && (
        <section className="flex gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Powtórzenia wzoru</h2>
            <input
              type="number"
              min={1}
              max={12}
              value={worksheet.sequenceRepetitions}
              onChange={(event) => {
                const value = Math.min(12, Math.max(1, Number(event.target.value) || 1))
                onSequenceRepetitionsChange(value)
              }}
              className="w-24 border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Puste pola</h2>
            <input
              type="number"
              min={1}
              max={3}
              value={worksheet.sequenceBlanks}
              onChange={(event) => {
                const value = Math.min(3, Math.max(1, Number(event.target.value) || 1))
                onSequenceBlanksChange(value)
              }}
              className="w-24 border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </div>
        </section>
      )}

      {/* Układ elementów - tylko dla szablonu "Wybierz" */}
      {worksheet.template === 'choice' && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Układ elementów</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onLayoutChange('row')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium ${
                worksheet.layout === 'row'
                  ? 'border-blue-600 bg-blue-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              Rząd
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange('scattered')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium ${
                worksheet.layout === 'scattered'
                  ? 'border-blue-600 bg-blue-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              Rozrzucone
            </button>
          </div>
        </section>
      )}

      {/* Rozmiar elementów - płynny suwak wspólny dla wszystkich szablonów */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Rozmiar elementów</h2>
          <span className="text-sm text-gray-500">{Math.round(worksheet.itemScale * 100)}%</span>
        </div>
        <input
          type="range"
          min={ITEM_SCALE_MIN}
          max={ITEM_SCALE_MAX}
          step={ITEM_SCALE_STEP}
          value={worksheet.itemScale}
          onChange={(event) => onItemScaleChange(Number(event.target.value))}
          className="w-full"
        />
        <button
          type="button"
          onClick={onResetAllItemScales}
          className="mt-1 text-sm text-blue-600 hover:underline"
        >
          Ujednolić rozmiar wszystkich elementów
        </button>
      </section>

      
      {/* Warianty - kilka wersji strony naraz */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Warianty</h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Liczba generowanych wariantów (stron)</label>
          <input
            type="number"
            min={1}
            max={10}
            value={worksheet.variantCount ?? 1}
            onChange={(e) => onVariantCountChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
          <p className="text-sm text-gray-500">
            Kolejne warianty mają inną kolejność elementów. Wydrukuj je wszystkie naraz jednym kliknięciem.
          </p>
        </div>
      </section>
</Step>

<Step step={3} active={activeStep}>
  <TaskStrip
    tasks={tasks}
    activeTaskIndex={activeTaskIndex}
    onSelectTask={onSelectTask}
    onAddTask={onAddTask}
    onRemoveTask={onRemoveTask}
  />

  {worksheet.template !== null && worksheet.template !== 'handwriting' && (
    <section>
      <label htmlFor="task-instruction" className="text-lg font-semibold mb-2 block">Polecenie</label>
      <input
        id="task-instruction"
        type="text"
        value={worksheet.instruction}
        onChange={(event) => onInstructionChange(event.target.value)}
        placeholder='np. "Wskaż zwierzę."'
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
      />
      <div className="flex items-center gap-3 mt-2">
        <span className="text-sm text-gray-600 shrink-0">Wielkość</span>
        <input
          type="range"
          min="0.5"
          max="2.5"
          step="0.1"
          value={worksheet.instructionScale ?? 1}
          onChange={(e) => onUpdateOptions({ instructionScale: parseFloat(e.target.value) })}
          className="flex-1"
          aria-label="Wielkość polecenia"
        />
        <span className="text-sm font-medium w-12 text-right">
          {Math.round((worksheet.instructionScale ?? 1) * 100)}%
        </span>
      </div>
    </section>
  )}

  {(hasAnswerKey || canShuffle) && (
    <section className="flex flex-col gap-2">
      {hasAnswerKey && (
        <Toggle label="Pokaż klucz odpowiedzi" hint="Tylko do sprawdzania - wyłącz przed wydrukiem dla uczniów." checked={showAnswerKey} onChange={onToggleAnswerKey} />
      )}
      {canShuffle && (
        <button
          type="button"
          onClick={onShuffle}
          className="self-start px-3 py-2 rounded-lg text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100"
        >
          🔀 Losuj kolejność elementów
        </button>
      )}
    </section>
  )}

  {worksheet.template === 'choice' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Opcje "Wybierz"</h2>
      <label className="flex items-center gap-2 cursor-pointer mt-2">
        <input type="checkbox" checked={worksheet.choiceShowCheckboxes || false} onChange={(e) => onUpdateOptions({ choiceShowCheckboxes: e.target.checked })} className="w-4 h-4 cursor-pointer" />
        <span className="text-sm font-medium text-gray-700">Pokaż puste kratki obok odpowiedzi (na ✓/✗)</span>
      </label>
    </section>
  )}

  {worksheet.template === 'matchPairs' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Styl linii bazowej</h2>
      <div className="flex gap-2">
        {(['solid', 'dashed', 'dotted'] as const).map(style => (
          <button key={style} type="button" onClick={() => onUpdateOptions({ matchPairsLineStyle: style })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.matchPairsLineStyle ?? 'solid') === style ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>
            {style === 'solid' ? 'Ciągła' : style === 'dashed' ? 'Przerywana' : 'Kropkowana'}
          </button>
        ))}
      </div>
    </section>
  )}

  {worksheet.template === 'yesNo' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Opcje Tak/Nie</h2>
      <label className="flex items-center gap-2 cursor-pointer mt-2">
        <input type="checkbox" checked={worksheet.yesNoUseColors || false} onChange={(e) => onUpdateOptions({ yesNoUseColors: e.target.checked })} className="w-4 h-4 cursor-pointer" />
        <span className="text-sm font-medium text-gray-700">Użyj kolorów (zielone Tak, czerwone Nie)</span>
      </label>
    </section>
  )}

  {worksheet.template === 'count' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Ułożenie elementów</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => onUpdateOptions({ countScattered: false })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${!worksheet.countScattered ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Siatka</button>
        <button type="button" onClick={() => onUpdateOptions({ countScattered: true })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${worksheet.countScattered ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Losowo</button>
      </div>
    </section>
  )}

  {worksheet.template === 'sequence' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Puste pola na odpowiedź</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => onUpdateOptions({ sequenceBlankStyle: 'underscore' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.sequenceBlankStyle ?? 'underscore') === 'underscore' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Podkreślenia</button>
        <button type="button" onClick={() => onUpdateOptions({ sequenceBlankStyle: 'box' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.sequenceBlankStyle ?? 'underscore') === 'box' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Puste ramki</button>
      </div>
    </section>
  )}

  {worksheet.template === 'cutCards' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Kolumny kartoników</h2>
      <div className="flex gap-2">
        {[2, 3, 4, 5].map(cols => (
          <button key={cols} type="button" onClick={() => onUpdateOptions({ cutCardsPerRow: cols })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.cutCardsPerRow ?? 3) === cols ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>
            {cols}
          </button>
        ))}
      </div>
    </section>
  )}

  {worksheet.template === 'sameOrDifferent' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Wyróżnienie wzorca</h2>
      <div className="flex gap-2">
        {(['box', 'underline', 'none'] as const).map(style => (
          <button key={style} type="button" onClick={() => onUpdateOptions({ sameOrDifferentReferenceStyle: style })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.sameOrDifferentReferenceStyle ?? 'box') === style ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>
            {style === 'box' ? 'Ramka' : style === 'underline' ? 'Podkreślenie' : 'Brak'}
          </button>
        ))}
      </div>
    </section>
  )}

  {worksheet.template === 'categorize' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Tryb wyświetlania</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => onUpdateOptions({ categorizeLayout: 'columns' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.categorizeLayout ?? 'columns') === 'columns' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Kolumny</button>
        <button type="button" onClick={() => onUpdateOptions({ categorizeLayout: 'areas' })} className={`flex-1 py-1.5 px-2 text-sm rounded-lg border ${(worksheet.categorizeLayout ?? 'columns') === 'areas' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}>Zamknięte obszary</button>
      </div>
    </section>
  )}

  {worksheet.template === 'maze' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">Labirynt</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poziom trudności: {getMazeLevel(worksheet.mazeLevel).label}
          </label>
          <input
            type="range"
            min={MAZE_LEVELS[0].value}
            max={MAZE_LEVELS[MAZE_LEVELS.length - 1].value}
            step={1}
            value={worksheet.mazeLevel ?? 2}
            onChange={(event) => onMazeLevelChange(Number(event.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Labirynt zawsze wypełnia całą kartkę - wyższy poziom to gęstsza siatka i dłuższa droga.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kształt korytarzy</label>
          <div className="flex gap-2">
            {MAZE_CARVERS.map((carver) => (
              <button
                key={carver.value}
                type="button"
                onClick={() => onMazeOptionsChange({ mazeCarver: carver.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mazeCarver ?? 'random') === carver.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {carver.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Kręte to długie korytarze z licznymi zakrętami, rozgałęzione to krótkie odnogi. Losowo
            daje każdemu wariantowi inny charakter.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ślepe uliczki</label>
          <div className="flex gap-2">
            {MAZE_DEAD_ENDS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onMazeOptionsChange({ mazeDeadEnds: option.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mazeDeadEnds ?? 'many') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Bez ślepych uliczek labirynt ma pętle i kilka dróg do mety - jest łatwiejszy, ale mniej podchwytliwy.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start i meta</label>
          <div className="flex gap-2">
            {MAZE_ENDS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onMazeOptionsChange({ mazeEnds: option.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mazeEnds ?? 'random') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Zaznacz „Pokaż klucz odpowiedzi", aby zobaczyć rozwiązanie. Każdy wariant karty to inny labirynt.
        </p>
      </div>
    </section>
  )}

  {worksheet.template === 'clock' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Zegar</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rodzaj ćwiczenia</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onClockOptionsChange({ clockMode: 'read' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.clockMode ?? 'read') === 'read' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Odczytaj
            </button>
            <button
              type="button"
              onClick={() => onClockOptionsChange({ clockMode: 'draw' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.clockMode === 'draw' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Narysuj
            </button>
            <button
              type="button"
              onClick={() => onClockOptionsChange({ clockMode: 'mixed' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.clockMode === 'mixed' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Na zmianę
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            „Odczytaj" daje zegar ze wskazówkami i pole na godzinę, „Narysuj" - godzinę i pustą tarczę.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dokładność</label>
          <div className="grid grid-cols-3 gap-2">
            {CLOCK_PRECISIONS.map((precision) => (
              <button
                key={precision.value}
                type="button"
                onClick={() => onClockOptionsChange({ clockPrecision: precision.value })}
                className={`py-2 px-1 text-sm rounded-lg border ${(worksheet.clockPrecision ?? 'hour') === precision.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {precision.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cyfry na tarczy</label>
          <div className="flex gap-2">
            {CLOCK_DIALS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onClockOptionsChange({ clockDial: option.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.clockDial ?? 'all') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.clockFormat24 ?? false}
            onChange={(event) => onClockOptionsChange({ clockFormat24: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Zapis 24-godzinny</span>
            <span className="block text-xs text-gray-500">
              Losuje też godziny popołudniowe: wskazówka na trójce, a zapis to 15:00.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.clockMinuteTicks ?? true}
            onChange={(event) => onClockOptionsChange({ clockMinuteTicks: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Kreski minutowe</span>
            <span className="block text-xs text-gray-500">Pomagają odczytać minuty; bez nich tarcza jest czytelniejsza.</span>
          </span>
        </label>

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Zegary wypełniają kartkę - ich wielkość ustawisz suwakiem rozmiaru elementów.
        </p>
      </div>
    </section>
  ) : worksheet.template === 'dotToDot' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Połącz kropki</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Obrazek</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onDotOptionsChange({ dotShape: 'random' })}
              className={`py-2 px-2 text-sm rounded-lg border ${worksheet.dotShape === 'random' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Losowy
            </button>
            {DOT_SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => onDotOptionsChange({ dotShape: shape.id })}
                className={`py-2 px-2 text-sm rounded-lg border ${(worksheet.dotShape ?? 'star') === shape.id ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {shape.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Przy losowym obrazku każdy wariant karty dostaje inny kształt.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Liczba kropek: {worksheet.dotCount ?? 20}
          </label>
          <input
            type="range"
            min={8}
            max={60}
            step={1}
            value={worksheet.dotCount ?? 20}
            onChange={(event) => onDotOptionsChange({ dotCount: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mniej kropek to prostszy kształt i większe cyfry; więcej - dokładniejszy obrazek.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numeracja</label>
          <div className="grid grid-cols-4 gap-2">
            {DOT_NUMBERING.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onDotOptionsChange({ dotNumbering: option.value })}
                className={`py-2 px-1 text-sm rounded-lg border ${(worksheet.dotNumbering ?? 'numbers') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            „Co drugi" ćwiczy liczenie dwójkami, „Wspak" - odliczanie w dół, „Litery" - alfabet.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.dotShowOutline ?? false}
            onChange={(event) => onDotOptionsChange({ dotShowOutline: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Blady kontur</span>
            <span className="block text-xs text-gray-500">
              Podpowiedź dla najmłodszych - widać, co powstanie po połączeniu kropek.
            </span>
          </span>
        </label>
      </div>
    </section>
  ) : worksheet.template === 'crossword' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Krzyżówka</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasło w kolumnie</label>
          <input
            type="text"
            value={worksheet.crosswordKeyword || ''}
            onChange={(event) => onCrosswordOptionsChange({ crosswordKeyword: event.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="np. WIOSNA"
          />
          <p className="text-xs text-gray-500 mt-1">
            Zostaw puste, a hasło ułoży się samo z losowo wybranych liter podanych słów.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Słowa i definicje</label>
            <button
              type="button"
              onClick={addCrosswordRow}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              + Dodaj wiersz
            </button>
          </div>
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_28px] gap-2 px-1 mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <span>Słowo</span>
            <span>Definicja</span>
            <span />
          </div>
          <div className="flex flex-col gap-2">
            {crosswordEditorRows.map((row, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_28px] gap-2 items-center">
                <input
                  type="text"
                  value={row.word}
                  onChange={(event) => updateCrosswordRow(index, 'word', event.target.value)}
                  aria-label={`Słowo ${index + 1}`}
                  className="min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={index === 0 ? 'kwiat' : 'słowo'}
                />
                <input
                  type="text"
                  value={row.clue}
                  onChange={(event) => updateCrosswordRow(index, 'clue', event.target.value)}
                  aria-label={`Definicja ${index + 1}`}
                  className="min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={index === 0 ? 'rośnie na łące' : 'definicja'}
                />
                <button
                  type="button"
                  onClick={() => removeCrosswordRow(index)}
                  disabled={crosswordEditorRows.length === 1 && !row.word && !row.clue}
                  aria-label={`Usuń wiersz ${index + 1}`}
                  title="Usuń wiersz"
                  className="w-7 h-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Każde hasło ma osobne pole na definicję, więc nic nie zlewa się w jeden tekst.
          </p>
          {crosswordSkipped.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Brakuje słowa z literą: {crosswordSkipped.join(', ')}. Dodaj słowo zawierające tę literę
              albo skróć hasło.
            </p>
          )}
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.crosswordShowClues ?? true}
            onChange={(event) => onCrosswordOptionsChange({ crosswordShowClues: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Definicje pod krzyżówką</span>
            <span className="block text-xs text-gray-500">Wyłącz, jeśli czytasz definicje na głos.</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.crosswordNumbers ?? true}
            onChange={(event) => onCrosswordOptionsChange({ crosswordNumbers: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Numery wierszy</span>
            <span className="block text-xs text-gray-500">Łączą kratki z definicjami pod spodem.</span>
          </span>
        </label>
      </div>
    </section>
  ) : worksheet.template === 'pattern' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Szlaczek</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wzór</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onPatternOptionsChange({ patternId: 'mixed' })}
              className={`py-2 px-2 text-sm rounded-lg border ${worksheet.patternId === 'mixed' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Różne
            </button>
            {PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => onPatternOptionsChange({ patternId: pattern.id })}
                className={`py-2 px-2 text-sm rounded-lg border ${(worksheet.patternId ?? 'waves') === pattern.id ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            „Różne" daje inny szlaczek w każdym wierszu, a każdemu wariantowi karty inny zestaw.
          </p>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Długość szlaczka</span>
            <span className="tabular-nums text-blue-700">{Math.round(worksheet.patternLength ?? 50)}%</span>
          </label>
          <input
            type="range"
            min={PATTERN_LENGTH_MIN}
            max={PATTERN_LENGTH_MAX}
            step={1}
            value={worksheet.patternLength ?? 50}
            onChange={(event) => onPatternOptionsChange({ patternLength: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Przesuń płynnie: wiersz zaczyna się gotowym wzorem, dalej idzie ślad do obrysowania,
            a pozostała część zostaje na samodzielne rysowanie.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.patternGuides ?? true}
            onChange={(event) => onPatternOptionsChange({ patternGuides: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Linie pomocnicze</span>
            <span className="block text-xs text-gray-500">Wzór nie wychodzi poza linie, tak jak w liniaturze.</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.patternStartDot ?? true}
            onChange={(event) => onPatternOptionsChange({ patternStartDot: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Kropka startowa</span>
            <span className="block text-xs text-gray-500">Zielona kropka pokazuje, gdzie postawić ołówek.</span>
          </span>
        </label>
      </div>
    </section>
  ) : worksheet.template === 'math' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Działania</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rodzaje działań</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MATH_OPERATION_LABELS) as MathOperation[]).map((operation) => {
              const active = (worksheet.mathOperations || ['add']).includes(operation)
              return (
                <button
                  key={operation}
                  type="button"
                  onClick={() => onMathOptionsChange({ mathOperations: toggleMathOperation(worksheet.mathOperations, operation) })}
                  className={`py-2 px-2 text-sm rounded-lg border ${active ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  {MATH_OPERATION_LABELS[operation]} {MATH_OPERATION_SIGNS[operation]}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zakres liczbowy</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="200"
              step="1"
              value={worksheet.mathMax ?? 20}
              onChange={(e) => onMathOptionsChange({ mathMax: parseInt(e.target.value, 10) })}
              className="flex-1"
            />
            <input 
              type="number"
              min="10"
              max="1000"
              value={worksheet.mathMax ?? 20}
              onChange={(e) => onMathOptionsChange({ mathMax: parseInt(e.target.value, 10) || 10 })}
              className="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm font-medium"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={!(worksheet.mathCrossTen ?? true)}
            onChange={(event) => onMathOptionsChange({ mathCrossTen: !event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Bez przekraczania progu dziesiątkowego</span>
            <span className="block text-xs text-gray-500">
              Dziecko liczy w obrębie jednej dziesiątki (7 + 2, nie 7 + 5). Dotyczy dodawania i odejmowania.
            </span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Co uczeń uzupełnia</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onMathOptionsChange({ mathMissing: 'result' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mathMissing ?? 'result') === 'result' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Wynik
            </button>
            <button
              type="button"
              onClick={() => onMathOptionsChange({ mathMissing: 'operand' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.mathMissing === 'operand' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Składnik
            </button>
            <button
              type="button"
              onClick={() => onMathOptionsChange({ mathMissing: 'mixed' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.mathMissing === 'mixed' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Na zmianę
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Działania wypełniają całą kartkę - liczbę kolumn ustawisz suwakiem rozmiaru elementów.
          „Pokaż klucz odpowiedzi" wpisuje wyniki w ramki.
        </p>
      </div>
    </section>
  ) : worksheet.template === 'coloring' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Kolorowanka</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rodzaj</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onColoringOptionsChange({ coloringMode: 'blank' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.coloringMode ?? 'blank') === 'blank' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Zwykła
            </button>
            <button
              type="button"
              onClick={() => onColoringOptionsChange({ coloringMode: 'numbers' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.coloringMode === 'numbers' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Koloruj wg kodu
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Złożoność wzoru: {getColoringLevel(worksheet.coloringLevel).label}
          </label>
          <input
            type="range"
            min={COLORING_LEVELS[0].value}
            max={COLORING_LEVELS[COLORING_LEVELS.length - 1].value}
            step={1}
            value={worksheet.coloringLevel ?? 2}
            onChange={(event) => onColoringOptionsChange({ coloringLevel: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Im prostszy wzór, tym większe pola - dla młodszych dzieci wybierz niższy poziom.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Osie symetrii: {worksheet.coloringSectors ? worksheet.coloringSectors : 'losowo'}
          </label>
          <input
            type="range"
            min={0}
            max={24}
            step={2}
            value={worksheet.coloringSectors ?? 0}
            onChange={(event) => onColoringOptionsChange({ coloringSectors: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Na zero każdy wariant karty dostaje inną liczbę osi - wzory są wtedy wyraźnie różne.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Krawędź wzoru</label>
          <div className="grid grid-cols-3 gap-2">
            {COLORING_CROWNS.map((crown) => (
              <button
                key={crown.value}
                type="button"
                onClick={() => onColoringOptionsChange({ coloringCrown: crown.value })}
                className={`py-2 px-2 text-sm rounded-lg border ${(worksheet.coloringCrown ?? 'auto') === crown.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {crown.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grubość linii: {Math.round((worksheet.coloringStroke ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.1}
            value={worksheet.coloringStroke ?? 1}
            onChange={(event) => onColoringOptionsChange({ coloringStroke: Number(event.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Grubsza kreska dla młodszych dzieci - łatwiej kolorować bez wychodzenia za linię.
          </p>
        </div>

        {worksheet.coloringMode === 'numbers' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liczba kolorów: {worksheet.coloringColorCount ?? 4}
            </label>
            <input
              type="range"
              min={COLOR_COUNT_MIN}
              max={COLOR_COUNT_MAX}
              step={1}
              value={worksheet.coloringColorCount ?? 4}
              onChange={(event) => onColoringOptionsChange({ coloringColorCount: Number(event.target.value) })}
              className="w-full"
            />
          </div>
        )}

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Każdy wariant karty to inny wzór - ustaw liczbę wariantów w sekcji „Warianty”, żeby wydrukować
          kilka różnych kolorowanek naraz. „Pokaż klucz odpowiedzi" pokazuje gotowy, pokolorowany wzór.
        </p>
      </div>
    </section>
  ) : worksheet.template === 'wordSearch' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Słowa do ukrycia</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wpisz słowa (jedno w wierszu)</label>
          <textarea
            value={worksheet.wordSearchWords || ''}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchWords: event.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            placeholder={'kot\npies\nsowa'}
          />
          {wordSearchSkipped.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Nie zmieściły się w siatce: {wordSearchSkipped.join(', ')}. Zwiększ rozmiar siatki lub skróć słowa.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rozmiar siatki: {worksheet.wordSearchGridSize || 10} × {worksheet.wordSearchGridSize || 10}
          </label>
          <input
            type="range"
            min={6}
            max={18}
            step={1}
            value={worksheet.wordSearchGridSize || 10}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchGridSize: Number(event.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kształt siatki</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchShape: 'square' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.wordSearchShape ?? 'square') === 'square' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Kwadrat
            </button>
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchShape: 'page' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.wordSearchShape === 'page' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Na całą kartkę
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Na całą kartkę siatka dostaje tyle wierszy, ile zmieści się w pionie - zmieści więcej słów.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wypełnienie pustych pól</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchFiller: 'random' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.wordSearchFiller ?? 'random') === 'random' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Losowe litery
            </button>
            <button
              type="button"
              onClick={() => onWordSearchOptionsChange({ wordSearchFiller: 'fromWords' })}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.wordSearchFiller === 'fromWords' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Litery z ukrytych słów
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Litery z ukrytych słów są trudniejsze - żadna przypadkowa litera nie zdradza pustego miejsca.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.wordSearchShowWords ?? true}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchShowWords: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Lista słów pod siatką</span>
            <span className="block text-xs text-gray-500">
              Bez listy zostaje sama liczba ukrytych słów - zadanie jest wtedy dużo trudniejsze.
            </span>
          </span>
        </label>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Kierunki ukrywania słów</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['wordSearchAllowHorizontal', 'Poziom', worksheet.wordSearchAllowHorizontal ?? true],
              ['wordSearchAllowVertical', 'Pion', worksheet.wordSearchAllowVertical ?? true],
              ['wordSearchAllowDiagonals', 'Ukos', worksheet.wordSearchAllowDiagonals ?? false],
            ] as const).map(([field, label, checked]) => (
              <label key={field} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => updateWordSearchDirection(field, event.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-semibold text-gray-900 text-sm">{label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={worksheet.wordSearchAllowReverse ?? false}
                onChange={(event) => onWordSearchOptionsChange({ wordSearchAllowReverse: event.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-semibold text-gray-900 text-sm">Wspak</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Zostaw co najmniej jeden kierunek. „Wspak” działa z każdym zaznaczonym kierunkiem.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.wordSearchUppercase ?? true}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchUppercase: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Wielkie litery</span>
            <span className="block text-xs text-gray-500">Wyłącz, żeby wydrukować małe litery.</span>
          </span>
        </label>
      </div>
    </section>
  ) : worksheet.template === 'handwriting' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">Tekst do pisania</h2>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Wpisz tekst
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => insertHandwritingTag('z')}
                className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                title="Czarny (zaznacz tekst i kliknij)"
              >
                Czarny
              </button>
              <button
                type="button"
                onClick={() => insertHandwritingTag('s')}
                className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                title="Ślad (zaznacz tekst i kliknij)"
              >
                Ślad
              </button>
            </div>
          </div>
          <textarea
            ref={handwritingTextareaRef}
            value={worksheet.handwritingText || ''}
            onChange={(e) => onHandwritingTextChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="np. Ala ma kota."
          />
          <p className="text-xs text-gray-500 mt-1">Zaznacz fragment i wybierz: czarny tekst albo ślad do obrysowania.</p>
        </div>
        
        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingRepeat}
            onChange={(event) => onHandwritingRepeatChange(event.target.checked)}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Zapełnij stronę</span>
            <span className="block text-xs text-gray-500">Powiel pierwszy wiersz na wszystkie linie.</span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Czcionka
          </label>
          <select
            value={worksheet.handwritingFont || DEFAULT_HANDWRITING_FONT}
            onChange={(e) => onHandwritingFontChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HANDWRITING_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            {getHandwritingFont(worksheet.handwritingFont).description}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kontrast śladu</label>
          <div className="flex gap-2">
            {TRACE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onHandwritingOptionsChange({ handwritingTrace: level.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.handwritingTrace ?? 'medium') === level.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Liniatura</label>
          <div className="flex gap-2">
            {GUIDE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onHandwritingOptionsChange({ handwritingGuides: level.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.handwritingGuides ?? 'full') === level.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {level.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Sama linia podstawowa albo brak linii to kolejne etapy usamodzielniania dziecka.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingEveryOther ?? false}
            onChange={(event) => onHandwritingOptionsChange({ handwritingEveryOther: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Co drugi wiersz pusty</span>
            <span className="block text-xs text-gray-500">
              Dziecko przepisuje wzór do pustego wiersza pod spodem.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingStartDot ?? false}
            onChange={(event) => onHandwritingOptionsChange({ handwritingStartDot: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Kropka startowa</span>
            <span className="block text-xs text-gray-500">Zielona kropka na początku każdego wiersza.</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.handwritingWideRowGap ?? false}
            onChange={(event) => onHandwritingOptionsChange({ handwritingWideRowGap: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Większy odstęp między wierszami</span>
            <span className="block text-xs text-gray-500">
              Ułatwienie dla dzieci, którym trudno trzymać się swojego wiersza.
            </span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domyślny styl pisma
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onHandwritingModeChange('solid')}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.handwritingMode === 'solid' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Zwykły
            </button>
            <button
              onClick={() => onHandwritingModeChange('tracing')}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.handwritingMode === 'tracing' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Po śladzie
            </button>
            <button
              onClick={() => onHandwritingModeChange('empty')}
              className={`flex-1 py-2 px-2 text-sm rounded-lg border ${worksheet.handwritingMode === 'empty' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              Tylko linie
            </button>
          </div>
        </div>
      </div>
    </section>
  ) : (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-2">Dodaj elementy</h2>
        {worksheet.template === 'maze' && (
          <p className="text-sm text-gray-500 mb-2">
            Dodaj dwa elementy: pierwszy oznaczy start, drugi metę (np. 🐭 i 🧀). Bez nich labirynt
            dostanie podpisy START i META.
          </p>
        )}
        {worksheet.template === 'matchPairs' && (
          <p className="text-sm text-gray-500 mb-2">
            Elementy dodajesz na przemian: najpierw lewa kolumna pary, potem prawa.
          </p>
        )}
        {(worksheet.template === 'count' || worksheet.template === 'yesNo') && (
          <p className="text-sm text-gray-500 mb-2">Dodanie nowego elementu zastąpi poprzedni.</p>
        )}
        {worksheet.template === 'sequence' && (
          <p className="text-sm text-gray-500 mb-2">Dodaj 2-4 elementy tworzące wzór (np. 🍎 🍌).</p>
        )}
        {worksheet.template === 'cutCards' && (
          <p className="text-sm text-gray-500 mb-2">Dodaj od 2 do 12 elementów - każdy trafi na osobny kartonik.</p>
        )}
        {worksheet.template === 'sameOrDifferent' && (
          <p className="text-sm text-gray-500 mb-2">
            Pierwszy dodany element to wzorzec. Kolejne to odpowiedzi do porównania.
          </p>
        )}
        {worksheet.template === 'categorize' && (
          <p className="text-sm text-gray-500 mb-2">
            Dodaj elementy do puli wspólnej. Uczeń przyporządkuje je do kategorii.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <ImageUploader onImageSelected={handleImageSelected} />

          <button
            type="button"
            onClick={() => {
              setShowLibrary((v) => !v);
              if (!showLibrary) setShowEmojiPicker(false);
            }}
            className="w-full bg-blue-50 text-blue-900 font-medium py-3 rounded-lg text-base border border-blue-200 hover:bg-blue-100"
          >
            {showLibrary ? 'Zamknij bibliotekę' : 'Moja biblioteka'}
          </button>
          {showLibrary && <MyLibrary onSelectItem={handleImageSelected} />}

          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => { const next = !v; if (next) setShowLibrary(false); return next; })}
            className="w-full bg-gray-100 text-gray-900 font-medium py-3 rounded-lg text-base border border-gray-300 hover:bg-gray-200"
          >
            {showEmojiPicker ? 'Ukryj emoji' : 'Emoji'}
          </button>
          {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelected} />}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Aktualne elementy</h2>
        <ElementsList
          worksheet={worksheet}
          onRemove={onRemoveItem}
          onDuplicate={onDuplicateItem}
          onMove={onMoveItem}
          onUpdateCaption={onUpdateCaption}
          onToggleCaption={onToggleCaption}
          onUpdateItemScale={onUpdateItemScale}
          onResetItemScale={onResetItemScale}
          onReorderItems={onReorderItems}
          onToggleCorrectAnswer={onToggleCorrectAnswer}
        />
      </section>
    </>
  )}
</Step>

<Step step={5} active={activeStep}>
{/* Nagłówek karty - opcjonalny tytuł i pola do wypełnienia przez ucznia */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Nagłówek karty</h2>
        <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={worksheet.header.showTitle}
              onChange={(event) => onHeaderChange({ showTitle: event.target.checked })}
              className="w-5 h-5"
            />
            <span>Tytuł karty</span>
          </label>
          {worksheet.header.showTitle && (
            <input
              type="text"
              value={worksheet.header.title}
              onChange={(event) => onHeaderChange({ title: event.target.value })}
              placeholder='np. "Karta pracy - Wiosna"'
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          )}
          <HeaderFieldToggle
            checked={worksheet.header.showName}
            label={worksheet.header.nameLabel}
            defaultLabel="Imię i nazwisko"
            onToggle={(checked) => onHeaderChange({ showName: checked })}
            onLabelChange={(nameLabel) => onHeaderChange({ nameLabel })}
          />
          <HeaderFieldToggle
            checked={worksheet.header.showDate}
            label={worksheet.header.dateLabel}
            defaultLabel="Data"
            onToggle={(checked) => onHeaderChange({ showDate: checked })}
            onLabelChange={(dateLabel) => onHeaderChange({ dateLabel })}
          />
          <HeaderFieldToggle
            checked={worksheet.header.showClass}
            label={worksheet.header.classLabel}
            defaultLabel="Klasa"
            onToggle={(checked) => onHeaderChange({ showClass: checked })}
            onLabelChange={(classLabel) => onHeaderChange({ classLabel })}
          />
        </div>
      </section>

      </Step>

<Step step={MORE_STEP.id} active={activeStep}>
      <div className="step-more">{extras}</div>
</Step>
      </div>
      </div>
    </div>
  )
}

interface ElementsListProps {
  onToggleCorrectAnswer?: (answerId: string) => void
  worksheet: WorksheetState
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  onUpdateCaption: (id: string, caption: string) => void
  onToggleCaption: (id: string) => void
  onUpdateItemScale: (id: string, scale: number) => void
  onResetItemScale: (id: string) => void
  onReorderItems: (activeId: string, overId: string) => void
}

function SortableItem({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  }

  return (
    <li ref={setNodeRef} style={style} className={`${className} ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}>
      <div className="absolute top-2 right-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
      </div>
      {children}
    </li>
  )
}

/** Lista aktualnie użytych elementów – różny widok w zależności od szablonu. */
function ElementsList({
  worksheet,
  onRemove,
  onDuplicate,
  onMove,
  onUpdateCaption,
  onToggleCaption,
  onUpdateItemScale,
  onResetItemScale,
  onReorderItems,
  onToggleCorrectAnswer,
}: ElementsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorderItems(active.id as string, over.id as string)
    }
  }

  if (worksheet.template === 'matchPairs') {
    if (worksheet.pairs.length === 0) {
      return <p className="text-gray-400 text-sm">Brak dodanych par.</p>
    }
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={worksheet.pairs.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-3">
            {worksheet.pairs.map((pair, index) => (
              <SortableItem key={pair.id} id={pair.id} className="border border-gray-200 rounded-lg px-3 py-2 bg-white relative pr-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {itemPreview(pair.left)} ↔ {pair.right ? itemPreview(pair.right) : '(czeka na parę)'}
                  </span>
                  <RowControls
                    index={index}
                    total={worksheet.pairs.length}
                    id={pair.id}
                    onRemove={onRemove}
                    onDuplicate={onDuplicate}
                    onMove={onMove}
                  />
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <CaptionEditor
                    item={pair.left}
                    label="Podpis (lewa)"
                    onUpdateCaption={onUpdateCaption}
                    onToggleCaption={onToggleCaption}
                  />
                  <ItemScaleEditor
                    item={pair.left}
                    globalScale={worksheet.itemScale}
                    onUpdateItemScale={onUpdateItemScale}
                    onResetItemScale={onResetItemScale}
                  />
                  {pair.right && (
                    <>
                      <CaptionEditor
                        item={pair.right}
                        label="Podpis (prawa)"
                        onUpdateCaption={onUpdateCaption}
                        onToggleCaption={onToggleCaption}
                      />
                      <ItemScaleEditor
                        item={pair.right}
                        globalScale={worksheet.itemScale}
                        onUpdateItemScale={onUpdateItemScale}
                        onResetItemScale={onResetItemScale}
                      />
                    </>
                  )}
                </div>
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    )
  }

  const listItems = worksheet.template === 'sequence' ? worksheet.sequenceItems : worksheet.items

  
  if (worksheet.template === 'yesNo') {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={listItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-3">
            {listItems.map((item, index) => (
              <SortableItem key={item.id} id={item.id} className="border border-gray-200 rounded-lg px-3 py-2 bg-white relative pr-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{itemPreview(item)}</span>
                  <RowControls index={index} total={listItems.length} id={item.id} onRemove={onRemove} onDuplicate={onDuplicate} onMove={onMove} />
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <CaptionEditor item={item} label="Podpis" onUpdateCaption={onUpdateCaption} onToggleCaption={onToggleCaption} />
                  <ItemScaleEditor item={item} globalScale={worksheet.itemScale} onUpdateItemScale={onUpdateItemScale} onResetItemScale={onResetItemScale} />
                  {onToggleCorrectAnswer && (
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1 text-sm text-green-700 font-medium cursor-pointer">
                        <input type="checkbox" checked={worksheet.correctAnswers?.includes('yes')} onChange={() => onToggleCorrectAnswer('yes')} /> Poprawna odp: TAK
                      </label>
                      <label className="flex items-center gap-1 text-sm text-green-700 font-medium cursor-pointer">
                        <input type="checkbox" checked={worksheet.correctAnswers?.includes('no')} onChange={() => onToggleCorrectAnswer('no')} /> Poprawna odp: NIE
                      </label>
                    </div>
                  )}
                </div>
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    )
  }

  if (listItems.length === 0) {
    return <p className="text-gray-400 text-sm">Brak dodanych elementów.</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={listItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-3">
          {listItems.map((item, index) => (
            <SortableItem key={item.id} id={item.id} className="border border-gray-200 rounded-lg px-3 py-2 bg-white relative pr-8">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {worksheet.template === 'sameOrDifferent' && index === 0 && (
                    <span className="font-semibold text-blue-700">Wzorzec: </span>
                  )}
                  {itemPreview(item)}
                </span>
                <RowControls
                  index={index}
                  total={listItems.length}
                  id={item.id}
                  onRemove={onRemove}
                  onDuplicate={onDuplicate}
                  onMove={onMove}
                />
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <CaptionEditor
                  item={item}
                  label="Podpis"
                  onUpdateCaption={onUpdateCaption}
                  onToggleCaption={onToggleCaption}
                />
                <ItemScaleEditor
                  item={item}
                  globalScale={worksheet.itemScale}
                  onUpdateItemScale={onUpdateItemScale}
                  onResetItemScale={onResetItemScale}
                  hidden={worksheet.template === 'cutCards'}
                />

                {worksheet.template !== null && ['choice', 'sameOrDifferent', 'categorize'].includes(worksheet.template) && !(worksheet.template === 'sameOrDifferent' && index === 0) && onToggleCorrectAnswer && (
                  <label className="flex items-center gap-1 text-sm text-green-700 font-medium mt-1 cursor-pointer">
                    <input type="checkbox" checked={worksheet.correctAnswers?.includes(item.id)} onChange={() => onToggleCorrectAnswer(item.id)} /> Poprawna odpowiedź
                  </label>
                )}
              </div>
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

interface CaptionEditorProps {
  item: WorksheetItem
  label: string
  onUpdateCaption: (id: string, caption: string) => void
  onToggleCaption: (id: string) => void
}

/** Pole do wpisania podpisu elementu i przełącznik jego widoczności. */
function CaptionEditor({ item, label, onUpdateCaption, onToggleCaption }: CaptionEditorProps) {
  const hasCaption = Boolean(item.caption?.trim())
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={item.caption ?? ''}
        onChange={(event) => onUpdateCaption(item.id, event.target.value)}
        placeholder={label}
        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
      />
      <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
        <input
          type="checkbox"
          checked={hasCaption && item.showCaption !== false}
          disabled={!hasCaption}
          onChange={() => onToggleCaption(item.id)}
        />
        Pokaż
      </label>
    </div>
  )
}

function itemPreview(item: WorksheetItem): string {
  return item.source === 'emoji' ? `${item.emoji} ${item.label}` : `🖼️ ${item.label}`
}

interface ItemScaleEditorProps {
  item: WorksheetItem
  /** Globalny rozmiar ustawiony suwakiem wyżej - używany, gdy element nie ma własnego rozmiaru. */
  globalScale: number
  onUpdateItemScale: (id: string, scale: number) => void
  onResetItemScale: (id: string) => void
  /** Ukrywa suwak - używane, gdy szablon wymaga jednolitego rozmiaru wszystkich elementów. */
  hidden?: boolean
}

/** Suwak indywidualnego rozmiaru elementu - domyślnie podąża za rozmiarem globalnym. */
function ItemScaleEditor({ item, globalScale, onUpdateItemScale, onResetItemScale, hidden = false }: ItemScaleEditorProps) {
  if (hidden) return null
  const effectiveScale = item.scale ?? globalScale
  const hasOverride = item.scale !== undefined
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={ITEM_SCALE_MIN}
        max={ITEM_SCALE_MAX}
        step={ITEM_SCALE_STEP}
        value={effectiveScale}
        onChange={(event) => onUpdateItemScale(item.id, Number(event.target.value))}
        className="flex-1"
      />
      <span className="text-xs text-gray-500 w-10 text-right">{Math.round(effectiveScale * 100)}%</span>
      {hasOverride && (
        <button
          type="button"
          onClick={() => onResetItemScale(item.id)}
          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
          title="Wróć do rozmiaru globalnego"
        >
          Reset
        </button>
      )}
    </div>
  )
}

interface RowControlsProps {
  index: number
  total: number
  id: string
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

function RowControls({ index, total, id, onRemove, onDuplicate, onMove }: RowControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onMove(id, 'up')}
        disabled={index === 0}
        className="px-2 py-1 text-gray-600 disabled:text-gray-300"
        aria-label="Przesuń wyżej"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(id, 'down')}
        disabled={index === total - 1}
        className="px-2 py-1 text-gray-600 disabled:text-gray-300"
        aria-label="Przesuń niżej"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={() => onDuplicate(id)}
        className="px-2 py-1 text-gray-600"
        aria-label="Duplikuj"
        title="Duplikuj"
      >
        ⧉
      </button>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="px-2 py-1 text-red-600"
        aria-label="Usuń"
      >
        ✕
      </button>
    </div>
  )
}

interface HeaderFieldToggleProps {
  checked: boolean
  label: string
  defaultLabel: string
  onToggle: (checked: boolean) => void
  onLabelChange: (label: string) => void
}

/** Przełącznik jednego pola nagłówka (np. "Data") z możliwością zmiany jego etykiety. */
function HeaderFieldToggle({ checked, label, defaultLabel, onToggle, onLabelChange }: HeaderFieldToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onToggle(event.target.checked)}
          className="w-5 h-5"
        />
      </label>
      <input
        type="text"
        value={label}
        onChange={(event) => onLabelChange(event.target.value)}
        disabled={!checked}
        placeholder={defaultLabel}
        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  )
}

/** Przełącznik on/off z etykietą - wspólny dla szybkich opcji i kroku Edycja. */
function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
      <span
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
        style={{ backgroundColor: checked ? '#2563eb' : '#d1d5db' }}
      >
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </label>
  )
}

interface TaskStripProps {
  tasks: WorksheetState[]
  activeTaskIndex: number
  onSelectTask: (index: number) => void
  onAddTask: () => void
  onRemoveTask: (index: number) => void
}

/**
 * Zadania na bieżącej stronie A4. Przy jednym zadaniu to tylko dyskretny link „dodaj",
 * przy kilku - przełącznik, żeby było jasne, które zadanie się edytuje.
 */
function TaskStrip({ tasks, activeTaskIndex, onSelectTask, onAddTask, onRemoveTask }: TaskStripProps) {
  const canAdd = tasks.length < 4
  if (tasks.length === 1) {
    return canAdd ? (
      <button type="button" onClick={onAddTask} className="self-start text-sm text-blue-600 hover:underline">
        + Dodaj drugie zadanie na tej stronie
      </button>
    ) : null
  }

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-2">
      <p className="px-1 pb-1.5 text-xs font-medium text-gray-600">
        Zadania na tej stronie - edytujesz <strong className="text-blue-800">zadanie {activeTaskIndex + 1}</strong>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tasks.map((task, index) => {
          const active = index === activeTaskIndex
          const label = TEMPLATE_OPTIONS.find((option) => option.value === task.template)?.label ?? 'puste'
          return (
            <span
              key={task.id ?? index}
              className={`inline-flex items-center rounded-lg border ${active ? 'border-blue-600 bg-white' : 'border-gray-200 bg-white/70'}`}
            >
              <button
                type="button"
                onClick={() => onSelectTask(index)}
                aria-pressed={active}
                className={`px-2.5 py-1.5 text-xs font-medium ${active ? 'text-blue-800' : 'text-gray-700'}`}
              >
                {index + 1}. {label}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Usunąć zadanie ${index + 1}?`)) onRemoveTask(index)
                }}
                aria-label={`Usuń zadanie ${index + 1}`}
                title="Usuń zadanie"
                className="pr-2 pl-0.5 py-1.5 text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            </span>
          )
        })}
        {canAdd && (
          <button
            type="button"
            onClick={onAddTask}
            className="px-2.5 py-1.5 rounded-lg border border-dashed border-blue-300 text-xs font-medium text-blue-700 hover:bg-white"
          >
            + Zadanie
          </button>
        )}
      </div>
    </section>
  )
}
