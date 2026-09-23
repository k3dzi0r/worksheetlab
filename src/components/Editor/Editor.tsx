import { useEffect, useMemo, useState } from 'react'
import type { WorksheetItem, WorksheetState, TemplateType, ChoiceLayout, PageOrientation, WorksheetHeader } from '../../types/worksheet'
import { TEMPLATE_OPTIONS, TEMPLATE_CATEGORIES, ITEM_SCALE_MIN, ITEM_SCALE_MAX, ITEM_SCALE_STEP, ANSWER_KEY_TEMPLATES, SHUFFLEABLE_TEMPLATES } from '../../types/worksheet'
import type { TemplateCategory, StepRequest } from '../../types/worksheet'
import { TemplateThumbnail } from './TemplateThumbnail'
import { HeaderFieldToggle, Toggle } from './controls'
import { TaskStrip } from './TaskStrip'
import { SimpleTemplateOptions } from './templateEditors/SimpleTemplateOptions'
import { MazeEditor } from './templateEditors/MazeEditor'
import { ClockEditor } from './templateEditors/ClockEditor'
import { DotToDotEditor } from './templateEditors/DotToDotEditor'
import { CrosswordEditor } from './templateEditors/CrosswordEditor'
import { PatternEditor } from './templateEditors/PatternEditor'
import { MathEditor } from './templateEditors/MathEditor'
import { ColoringEditor } from './templateEditors/ColoringEditor'
import { WordSearchEditor } from './templateEditors/WordSearchEditor'
import { HandwritingEditor } from './templateEditors/HandwritingEditor'
import { ItemsEditor } from './templateEditors/ItemsEditor'
import { EXAMPLE_THEMES, WORKSHEET_EXAMPLES } from '../../examples'
import type { ExampleTheme, WorksheetExample } from '../../examples'


import { SupportPopover } from '../SupportPopover'

/** Usuwa rozszerzenie pliku (np. ".png"), żeby zaproponować czytelną nazwę jako podpis. */
/** Rozdziela zapis tekstowy projektu na dwa jawne pola edytora. */
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
  answerKeyPages: boolean
  onToggleAnswerKeyPages: () => void
  projectName: string
  onOpenProjects: () => void
  onNewProject: () => void
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
  answerKeyPages,
  onToggleAnswerKeyPages,
  projectName,
  onOpenProjects,
  onNewProject,
}: EditorProps) {
  // Wczytana karta z szablonem zaczyna od edycji, pusta - od wyboru szablonu.
  const [activeStep, setActiveStep] = useState<number>(worksheet.template === null ? 1 : EDIT_STEP_ID)
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
  const [exampleTheme, setExampleTheme] = useState<ExampleTheme | 'all'>('all')
  const [showAllExamples, setShowAllExamples] = useState(false)
  const themeExamples = useMemo(
    () => (exampleTheme === 'all' ? WORKSHEET_EXAMPLES : WORKSHEET_EXAMPLES.filter((example) => example.theme === exampleTheme)),
    [exampleTheme],
  )
  // Po jednym przykładzie z każdego tematu na start - reszta pod „Pokaż wszystkie".
  const visibleExamples = useMemo(() => {
    if (exampleTheme !== 'all' || showAllExamples) return themeExamples
    return EXAMPLE_THEMES.flatMap((theme) => WORKSHEET_EXAMPLES.find((example) => example.theme === theme.value) ?? [])
  }, [exampleTheme, showAllExamples, themeExamples])
  const visibleTemplates = useMemo(
    () =>
      templateCategory === 'all'
        ? TEMPLATE_OPTIONS
        : TEMPLATE_OPTIONS.filter((option) => option.category === templateCategory),
    [templateCategory],
  )


  // Szybkie opcje, plik i wsparcie: na komputerze w panelu kroków, na telefonie w kroku "Więcej".
  const extras = (
    <>
        {/* Karty zapisane w tej przeglądarce */}
        <div className="editor-projects mt-6 px-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Twoja karta</h2>
          <p className="text-sm font-semibold text-gray-900 truncate" title={projectName}>{projectName}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={onOpenProjects} className="px-2 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-800 hover:bg-blue-100">
              Moje karty
            </button>
            <button type="button" onClick={onNewProject} className="px-2 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
              + Nowa karta
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-gray-500">Zapis tylko w tej przeglądarce - ważne karty pobierz do pliku.</p>
        </div>

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
              <span className="text-[10px] leading-tight font-medium">Otwórz<br/>plik</span>
            </label>
            <button type="button" onClick={onExport} className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-center h-[72px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[10px] leading-tight font-medium">Pobierz<br/>do pliku</span>
            </button>
            <button type="button" onClick={() => {
              if (window.confirm('Wyczyścić całą zawartość tej karty? (Można to cofnąć)')) {
                onClear()
              }
            }} className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-center h-[72px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span className="text-[10px] leading-tight font-medium">Wyczyść<br/>kartę</span>
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
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EXAMPLE_THEMES.map((theme) => (
              <button
                key={theme.value}
                type="button"
                onClick={() => setExampleTheme(theme.value)}
                aria-pressed={exampleTheme === theme.value}
                className={`px-2.5 py-1 text-xs rounded-full border ${
                  exampleTheme === theme.value
                    ? 'bg-blue-600 border-blue-600 text-white font-medium'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {visibleExamples.map((example) => (
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
          {visibleExamples.length < themeExamples.length && (
            <button type="button" onClick={() => setShowAllExamples(true)} className="mt-2 text-sm text-blue-600 hover:underline">
              Pokaż wszystkie przykłady ({themeExamples.length})
            </button>
          )}
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
        <>
          <Toggle label="Pokaż klucz na podglądzie" hint="Rozwiązania widoczne na kartce na ekranie." checked={showAnswerKey} onChange={onToggleAnswerKey} />
          <Toggle
            label="Drukuj klucz na osobnej stronie"
            hint="Karty dla uczniów bez rozwiązań, na końcu strony z kluczem dla Ciebie."
            checked={answerKeyPages}
            onChange={onToggleAnswerKeyPages}
          />
        </>
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

  <SimpleTemplateOptions worksheet={worksheet} onUpdateOptions={onUpdateOptions} />
  {worksheet.template === 'maze' && (
    <MazeEditor worksheet={worksheet} onMazeLevelChange={onMazeLevelChange} onMazeOptionsChange={onMazeOptionsChange} />
  )}
  {worksheet.template === 'clock' ? (
    <ClockEditor worksheet={worksheet} onClockOptionsChange={onClockOptionsChange} />
  ) : worksheet.template === 'dotToDot' ? (
    <DotToDotEditor worksheet={worksheet} onDotOptionsChange={onDotOptionsChange} />
  ) : worksheet.template === 'crossword' ? (
    <CrosswordEditor worksheet={worksheet} onCrosswordOptionsChange={onCrosswordOptionsChange} />
  ) : worksheet.template === 'pattern' ? (
    <PatternEditor worksheet={worksheet} onPatternOptionsChange={onPatternOptionsChange} />
  ) : worksheet.template === 'math' ? (
    <MathEditor worksheet={worksheet} onMathOptionsChange={onMathOptionsChange} />
  ) : worksheet.template === 'coloring' ? (
    <ColoringEditor worksheet={worksheet} onColoringOptionsChange={onColoringOptionsChange} />
  ) : worksheet.template === 'wordSearch' ? (
    <WordSearchEditor worksheet={worksheet} onWordSearchOptionsChange={onWordSearchOptionsChange} />
  ) : worksheet.template === 'handwriting' ? (
    <HandwritingEditor
      worksheet={worksheet}
      onHandwritingTextChange={onHandwritingTextChange}
      onHandwritingModeChange={onHandwritingModeChange}
      onHandwritingRepeatChange={onHandwritingRepeatChange}
      onHandwritingFontChange={onHandwritingFontChange}
      onHandwritingOptionsChange={onHandwritingOptionsChange}
    />
  ) : (
    <ItemsEditor
      worksheet={worksheet}
      onAddItem={onAddItem}
      onRemoveItem={onRemoveItem}
      onDuplicateItem={onDuplicateItem}
      onMoveItem={onMoveItem}
      onUpdateCaption={onUpdateCaption}
      onToggleCaption={onToggleCaption}
      onUpdateItemScale={onUpdateItemScale}
      onResetItemScale={onResetItemScale}
      onReorderItems={onReorderItems}
      onToggleCorrectAnswer={onToggleCorrectAnswer}
    />
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
