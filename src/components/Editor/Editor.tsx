import { useMemo, useRef, useState } from 'react'
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
import { TEMPLATE_OPTIONS, ITEM_SCALE_MIN, ITEM_SCALE_MAX, ITEM_SCALE_STEP } from '../../types/worksheet'
import { ImageUploader } from '../ImageUploader/ImageUploader'
import { EmojiPicker } from '../EmojiPicker/EmojiPicker'
import { MyLibrary } from '../MyLibrary/MyLibrary'
import type { EmojiEntry } from '../../data/emojis'
import { createId } from '../../utils'
import { generateWordSearch, parseWords } from '../../wordSearch'
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
import { MATH_OPERATION_LABELS, MATH_OPERATION_SIGNS, MATH_RANGES } from '../../mathTasks'
import type { MathOperation } from '../../mathTasks'

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

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
      >
        <span>{title}</span>
        <span className={`transform transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </span>
      </button>
      {isOpen && <div className="p-4 border-t border-gray-200 flex flex-col gap-4">{children}</div>}
    </div>
  )
}

interface EditorProps {
  showAnswerKey?: boolean
  onToggleAnswerKey?: () => void
  onToggleCorrectAnswer?: (answerId: string) => void
  worksheet: WorksheetState
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
  onInstructionChange: (instruction: string) => void
  onCountRepetitionsChange: (count: number) => void
  onLayoutChange: (layout: ChoiceLayout) => void
  onItemScaleChange: (itemScale: number) => void
  onUpdateItemScale: (id: string, scale: number) => void
  onResetItemScale: (id: string) => void
  onResetAllItemScales: () => void
  onOrientationChange: (orientation: PageOrientation) => void
  onSimpleModeChange: (simpleMode: boolean) => void
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
  onShuffle: () => void
  onPrint: () => void
  onExport: () => void
  onImport: (text: string) => void
  onClear: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  saveStatus: 'saved' | 'saving' | 'idle'
  onReorderItems: (activeId: string, overId: string) => void
}

/** Lewy panel edycji: wybór szablonu, treść polecenia, dodawanie elementów, lista elementów. */
export function Editor({
  worksheet,
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
  onInstructionChange,
  onCountRepetitionsChange,
  onLayoutChange,
  onItemScaleChange,
  onUpdateItemScale,
  onResetItemScale,
  onResetAllItemScales,
  onOrientationChange,
  onSimpleModeChange,
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
  onShuffle,
  onPrint,
  onExport,
  onImport,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saveStatus,
  onReorderItems,
  showAnswerKey,
  onToggleAnswerKey,
  onToggleCorrectAnswer,
}: EditorProps) {
  const [showLibrary, setShowLibrary] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const handwritingTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Ostrzeżenie w edytorze: które słowa nie zmieściły się w siatce wykreślanki.
  const wordSearchSkipped = useMemo(() => {
    if (worksheet.template !== 'wordSearch') return []
    return generateWordSearch(parseWords(worksheet.wordSearchWords || ''), {
      size: worksheet.wordSearchGridSize || 10,
      allowDiagonals: worksheet.wordSearchAllowDiagonals ?? false,
      allowReverse: worksheet.wordSearchAllowReverse ?? false,
      seed: 1,
    }).skipped
  }, [
    worksheet.template,
    worksheet.wordSearchWords,
    worksheet.wordSearchGridSize,
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

  function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // pozwala zaimportować ten sam plik ponownie
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImport(reader.result)
      }
    }
    reader.readAsText(file)
  }

  function handleImageSelected(dataUrl: string, fileName: string) {
    // Podpis jest od razu proponowany na podstawie nazwy pliku - użytkownik może go dowolnie zmienić.
    const caption = stripFileExtension(fileName)
    onAddItem({ id: createId(), source: 'image', imageDataUrl: dataUrl, label: fileName, caption, showCaption: false })
  }

  function handleEmojiSelected(entry: EmojiEntry) {
    // Podpis jest od razu proponowany na podstawie polskiej nazwy emoji - można go zmienić.
    onAddItem({ id: createId(), source: 'emoji', emoji: entry.emoji, label: entry.name, caption: entry.name, showCaption: false })
  }

  const showShuffleButton =
    worksheet.template === 'choice' ||
    worksheet.template === 'matchPairs' ||
    worksheet.template === 'oddOneOut' ||
    worksheet.template === 'sameOrDifferent'

  return (
    <div className="flex flex-col gap-2 p-6 overflow-y-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">WorksheetLab</h1>
        <p className="text-gray-500 text-sm">Kreator kart pracy A4</p>
      </header>

      <Accordion title="1. Szablon" defaultOpen={false}>
{/* Wybór szablonu */}
      <section>
        <h2 className="text-lg font-semibold mb-2">1. Wybierz typ karty</h2>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTemplateChange(option.value)}
              className={`text-left px-4 py-3 rounded-lg border-2 ${
                worksheet.template === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </section>
</Accordion>

<Accordion title="2. Układ" defaultOpen={false}>


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

      {/* Tryb prosty - większe elementy i polecenie, dla łatwiejszej czytelności */}
      <section>
        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.simpleMode}
            onChange={(event) => onSimpleModeChange(event.target.checked)}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900">Tryb prosty</span>
            <span className="block text-sm text-gray-500">Większe elementy i polecenie — dla młodszych uczniów.</span>
          </span>
        </label>
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

      
</Accordion>

<Accordion title="3. Edycja elementów" defaultOpen={false}>
  {worksheet.template === 'maze' && (
    <section>
      <h2 className="text-lg font-semibold mb-2">3. Labirynt</h2>
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

  {worksheet.template === 'math' ? (
    <section>
      <h2 className="text-lg font-semibold mb-2">3. Działania</h2>
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
          <div className="flex gap-2">
            {MATH_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => onMathOptionsChange({ mathMax: range })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mathMax ?? 20) === range ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                do {range}
              </button>
            ))}
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
      <h2 className="text-lg font-semibold mb-2">3. Kolorowanka</h2>
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
      <h2 className="text-lg font-semibold mb-2">3. Słowa do ukrycia</h2>
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

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.wordSearchAllowDiagonals ?? false}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchAllowDiagonals: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Ukośne</span>
            <span className="block text-xs text-gray-500">Słowa mogą biec na skos - trudniejsze.</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={worksheet.wordSearchAllowReverse ?? false}
            onChange={(event) => onWordSearchOptionsChange({ wordSearchAllowReverse: event.target.checked })}
            className="w-5 h-5"
          />
          <span>
            <span className="font-semibold text-gray-900 block text-sm">Wspak</span>
            <span className="block text-xs text-gray-500">Słowa mogą być zapisane od tyłu.</span>
          </span>
        </label>

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
      <h2 className="text-lg font-semibold mb-2">3. Tekst do pisania</h2>
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
              <button
                type="button"
                onClick={() => insertHandwritingTag('p')}
                className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                title="Pusto (zaznacz tekst i kliknij)"
              >
                Puste
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
          <p className="text-xs text-gray-500 mt-1">Zaznacz fragment i kliknij przycisk, aby zmienić jego styl.</p>
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
        <h2 className="text-lg font-semibold mb-2">3. Dodaj elementy</h2>
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
        <h2 className="text-lg font-semibold mb-2">4. Aktualne elementy</h2>
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
</Accordion>

<Accordion title="4. Warianty" defaultOpen={false}>
{/* Warianty */}
      <section>
        <h2 className="text-lg font-semibold mb-2">5. Warianty</h2>
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

      
</Accordion>

<Accordion title="5. Nagłówek i Polecenie" defaultOpen={false}>
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

      {/* Polecenie */}
      <section>
        <h2 className="text-lg font-semibold mb-2">2. Polecenie</h2>
        <input
          type="text"
          value={worksheet.instruction}
          onChange={(event) => onInstructionChange(event.target.value)}
          placeholder='np. "Wskaż zwierzę."'
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
        />
      </section>

      
</Accordion>


{/* Akcje */}
      <section className="flex flex-col gap-3 pt-2 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="flex-1 bg-gray-100 text-gray-900 font-medium py-3 rounded-lg text-base hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cofnij
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="flex-1 bg-gray-100 text-gray-900 font-medium py-3 rounded-lg text-base hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ponów
          </button>
        </div>
        {showShuffleButton && (
          <button
            type="button"
            onClick={onShuffle}
            className="w-full bg-amber-500 text-white font-medium py-3 rounded-lg text-base hover:bg-amber-600"
          >
            Losuj kolejność
          </button>
        )}
        <button
          type="button"
          onClick={onPrint}
          className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg text-base hover:bg-green-700"
        >
          Drukuj / Zapisz jako PDF
        </button>

        {onToggleAnswerKey && (
          <label className="flex items-center justify-center gap-2 w-full bg-blue-100 text-blue-900 font-medium py-3 rounded-lg text-base hover:bg-blue-200 cursor-pointer mb-2">
            <input type="checkbox" checked={showAnswerKey} onChange={onToggleAnswerKey} className="w-5 h-5 cursor-pointer" />
            <span>Pokaż klucz odpowiedzi na podglądzie</span>
          </label>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExport}
            className="flex-1 bg-gray-100 text-gray-900 font-medium py-3 rounded-lg text-base border border-gray-300 hover:bg-gray-200"
          >
            Eksportuj projekt
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex-1 bg-gray-100 text-gray-900 font-medium py-2 rounded-lg text-sm hover:bg-gray-200"
          >
            Wczytaj z pliku
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Czy na pewno chcesz usunąć wszystko i zacząć od nowa?')) {
                onClear()
              }
            }}
            className="flex-1 bg-red-100 text-red-700 font-medium py-2 rounded-lg text-sm hover:bg-red-200"
          >
            Wyczyść wszystko
          </button>
        </div>
        <div className="text-center h-4 mt-1">
          {saveStatus === 'saved' && <span className="text-xs text-green-600 font-medium">✔ Zapisano lokalnie</span>}
          {saveStatus === 'saving' && <span className="text-xs text-gray-400">Zapisywanie robocze...</span>}
        </div>
      </section>
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

                {['choice', 'oddOneOut', 'sameOrDifferent', 'categorize'].includes(worksheet.template) && !(worksheet.template === 'sameOrDifferent' && index === 0) && onToggleCorrectAnswer && (
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
