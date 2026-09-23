import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type {
  WorksheetItem,
  WorksheetState,
  ProjectState,
  TemplateType,
  ChoiceLayout,
  PageOrientation,
  MatchPair,
  WorksheetPage,
} from './types/worksheet'
import { ITEM_SCALE_DEFAULT, ITEM_SCALE_MIN, ITEM_SCALE_MAX, DEFAULT_WORKSHEET_HEADER, ANSWER_KEY_TEMPLATES } from './types/worksheet'
import type { WorksheetHeader, StepRequest } from './types/worksheet'
import type { WorksheetExample } from './examples'
import { createId, shuffleArray, clamp } from './utils'
import { downloadProjectJson, parseProjectJson } from './worksheetIO'
import { useUndoRedo } from './hooks/useUndoRedo'
import { useProjectLibrary } from './hooks/useProjectLibrary'
import { Editor } from './components/Editor/Editor'
import { WorksheetPreview } from './components/WorksheetPreview/WorksheetPreview'
import { PageManager } from './components/PageManager'
import { TopBar } from './components/TopBar'
import { SupportThankYouModal } from './components/SupportThankYouModal'
import { MobilePrintHelp, shouldShowMobilePrintHelp } from './components/MobilePrintHelp'
import { UpdateBanner } from './components/UpdateBanner'
import { MyProjectsDialog } from './components/MyProjectsDialog'
import { registerServiceWorker } from './serviceWorker'
import { canShowSupportReminder, disableSupportReminder, postponeSupportReminder } from './support'

/** Wymiary kartki A4 w pikselach przy 96 dpi - potrzebne do dopasowania podglądu do panelu. */
const PAGE_SIZE_PX = {
  portrait: { width: 794, height: 1123 },
  landscape: { width: 1123, height: 794 },
}

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

function createWorksheet(overrides: Partial<WorksheetState> = {}): WorksheetState {
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
function createBlankProject(): ProjectState {
  return { pages: [createPage()], activePageIndex: 0, activeTaskIndex: 0, showPageNumbers: false, showBranding: true }
}

function createPage(orientation: PageOrientation = 'portrait', task?: WorksheetState): WorksheetPage {
  return {
    id: createId(),
    orientation,
    header: { ...DEFAULT_WORKSHEET_HEADER },
    variantCount: 1,
    tasks: [task ?? createWorksheet({ orientation })],
  }
}

/**
 * Miękki limit liczby elementów w niektórych szablonach, żeby karta czytelnie
 * mieściła się na A4. W trybie prostym limit jest niższy, bo elementy są większe.
 */
function getMaxItems(template: TemplateType | null): number | null {
  if (template === 'choice' || template === 'cutCards' || template === 'categorize') return 12;
  if (template === 'sameOrDifferent') return 13;
  if (template === 'matchPairs') return 6;
  return null;
}

function App() {
  const {
    state: project,
    set: setProject,
    reset: resetProject,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<ProjectState>(INITIAL_PROJECT)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [isSupportThankYouOpen, setIsSupportThankYouOpen] = useState(false)
  // Nieaktywne strony są normalnie `display:none`, więc ich liniatura (mierzona przez
  // ResizeObserver na realnej szerokości kontenera) nigdy się nie przelicza - w PDF-ie
  // wychodziły puste. Przed drukiem pokazujemy wszystkie strony i czekamy klatkę, żeby
  // layout i ResizeObserver zdążyły się przeliczyć zanim window.print() zrobi zrzut.
  const [isPrintingAllPages, setIsPrintingAllPages] = useState(false)
  const finishPrintRef = useRef<(() => void) | null>(null)
  /** null oznacza „dopasuj całą stronę do viewportu podglądu". */
  const [previewZoom, setPreviewZoom] = useState<number | null>(null)
  const [stepRequest, setStepRequest] = useState<StepRequest | null>(null)
  const [isPrintHelpOpen, setIsPrintHelpOpen] = useState(false)
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null)

  useEffect(() => {
    registerServiceWorker((apply) => setApplyUpdate(() => apply))
  }, [])

  const library = useProjectLibrary(project, resetProject)
  const { saveStatus, isReady } = library
  const [isProjectsOpen, setIsProjectsOpen] = useState(false)

  const openProjects = useCallback(() => {
    library.refreshList()
    setIsProjectsOpen(true)
  }, [library])




  
  const activePage = project.pages[project.activePageIndex] || INITIAL_PROJECT.pages[0]
  const activeTaskIndex = Math.min(project.activeTaskIndex, activePage.tasks.length - 1)
  const activeTask = activePage.tasks[activeTaskIndex] || INITIAL_WORKSHEET
  // Edytor używa jednego WorksheetState, ale te trzy ustawienia należą do całej strony A4.
  const worksheet: WorksheetState = {
    ...activeTask,
    orientation: activePage.orientation,
    header: activePage.header,
    variantCount: activePage.variantCount,
  }

  const setWorksheet = useCallback((updater: (prev: WorksheetState) => WorksheetState) => {
    setProject((prevProj) => {
      const newPages = [...prevProj.pages]
      const activeIdx = prevProj.activePageIndex
      const page = newPages[activeIdx] || createPage()
      const taskIndex = Math.min(prevProj.activeTaskIndex, page.tasks.length - 1)
      const tasks = [...page.tasks]
      tasks[taskIndex] = updater(tasks[taskIndex] || createWorksheet({ orientation: page.orientation, header: page.header }))
      newPages[activeIdx] = { ...page, tasks }
      return { ...prevProj, pages: newPages }
    })
  }, [setProject])

  const handleTogglePageNumbers = useCallback(() => {
    setProject((prev) => ({ ...prev, showPageNumbers: !prev.showPageNumbers }))
  }, [setProject])

  const handleToggleAnswerKeyPages = useCallback(() => {
    setProject((prev) => ({ ...prev, answerKeyPages: !prev.answerKeyPages }))
  }, [setProject])

  const handleToggleBranding = useCallback(() => {
    setProject((prev) => ({ ...prev, showBranding: !(prev.showBranding ?? true) }))
  }, [setProject])

  const handleToggleCorrectAnswer = useCallback(
    (answerId: string) => {
      setWorksheet((prev) => {
        const correctAnswers = prev.correctAnswers || []
        if (correctAnswers.includes(answerId)) {
          return { ...prev, correctAnswers: correctAnswers.filter((id) => id !== answerId) }
        } else {
          return { ...prev, correctAnswers: [...correctAnswers, answerId] }
        }
      })
    },
    [setWorksheet]
  )

  const addPage = useCallback(() => {
    setProject((prev) => {
      const newPage = createPage(prev.pages[0]?.orientation || 'portrait')
      return {
        ...prev,
        pages: [...prev.pages, newPage],
        activePageIndex: prev.pages.length,
        activeTaskIndex: 0,
      }
    })
  }, [setProject])

  const removePage = useCallback((index: number) => {
    setProject((prev) => {
      if (prev.pages.length <= 1) return prev
      const newPages = prev.pages.filter((_, i) => i !== index)
      const newActiveIndex = Math.min(prev.activePageIndex, newPages.length - 1)
      return { ...prev, pages: newPages, activePageIndex: newActiveIndex, activeTaskIndex: 0 }
    })
  }, [setProject])

  const duplicatePage = useCallback((index: number) => {
    setProject((prev) => {
      const pageToCopy = prev.pages[index]
      if (!pageToCopy) return prev
      const newPage = { ...pageToCopy, id: createId(), tasks: pageToCopy.tasks.map((task) => ({ ...task, id: createId() })) }
      const newPages = [...prev.pages]
      newPages.splice(index + 1, 0, newPage)
      return { ...prev, pages: newPages, activePageIndex: index + 1, activeTaskIndex: 0 }
    })
  }, [setProject])

  const setActivePage = useCallback((index: number) => {
    setProject((prev) => ({ ...prev, activePageIndex: index, activeTaskIndex: 0 }))
  }, [setProject])

  const setActiveTask = useCallback((index: number) => {
    setProject((prev) => {
      const page = prev.pages[prev.activePageIndex]
      if (!page || index < 0 || index >= page.tasks.length) return prev
      return { ...prev, activeTaskIndex: index }
    })
  }, [setProject])

  const addTask = useCallback(() => {
    setProject((prev) => {
      const pageIndex = prev.activePageIndex
      const page = prev.pages[pageIndex]
      if (!page || page.tasks.length >= 4) return prev
      const newTask = createWorksheet({ orientation: page.orientation, header: page.header })
      const pages = [...prev.pages]
      pages[pageIndex] = { ...page, tasks: [...page.tasks, newTask] }
      return { ...prev, pages, activeTaskIndex: page.tasks.length }
    })
  }, [setProject])

  const removeTask = useCallback((index: number) => {
    setProject((prev) => {
      const pageIndex = prev.activePageIndex
      const page = prev.pages[pageIndex]
      if (!page || page.tasks.length <= 1 || index < 0 || index >= page.tasks.length) return prev
      const pages = [...prev.pages]
      pages[pageIndex] = { ...page, tasks: page.tasks.filter((_, taskIndex) => taskIndex !== index) }
      return { ...prev, pages, activeTaskIndex: Math.min(index, page.tasks.length - 2) }
    })
  }, [setProject])

  const reorderPages = useCallback((oldIndex: number, newIndex: number) => {
    setProject((prev) => {
      const newPages = [...prev.pages]
      const [moved] = newPages.splice(oldIndex, 1)
      newPages.splice(newIndex, 0, moved)
      
      let newActiveIndex = prev.activePageIndex
      if (prev.activePageIndex === oldIndex) {
        newActiveIndex = newIndex
      } else if (oldIndex < prev.activePageIndex && newIndex >= prev.activePageIndex) {
        newActiveIndex--
      } else if (oldIndex > prev.activePageIndex && newIndex <= prev.activePageIndex) {
        newActiveIndex++
      }

      return { ...prev, pages: newPages, activePageIndex: newActiveIndex }
    })
  }, [setProject])


  function handleTemplateChange(template: TemplateType) {
    // Każdy szablon ma inny kształt danych, więc przy zmianie czyścimy zawartość,
    // żeby uniknąć niespójnych stanów (np. par bez odpowiednika w innym szablonie).
    // Orientacja strony to ustawienie globalne, więc ją zachowujemy.
    setWorksheet((prev) => createWorksheet({ ...prev, template, items: [], pairs: [], sequenceItems: [], correctAnswers: [] }))
  }

  function handleHandwritingTextChange(text: string) {
    setWorksheet((prev) => ({ ...prev, handwritingText: text }))
  }

  function handleHandwritingRepeatChange(repeat: boolean) {
    setWorksheet((prev) => ({ ...prev, handwritingRepeat: repeat }))
  }

  function handleHandwritingFontChange(font: string) {
    setWorksheet((prev) => ({ ...prev, handwritingFont: font }))
  }

  function handleHandwritingModeChange(mode: 'solid' | 'tracing' | 'empty') {
    setWorksheet((prev) => ({ ...prev, handwritingMode: mode }))
  }

  function handleWordSearchOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleMazeLevelChange(level: number) {
    setWorksheet((prev) => ({ ...prev, mazeLevel: level }))
  }

  function handleMazeOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleColoringOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleClockOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleDotOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleCrosswordOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleHandwritingOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handlePatternOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleMathOptionsChange(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleInstructionChange(instruction: string) {
    setWorksheet((prev) => ({ ...prev, instruction }))
  }

  function handleUpdateOptions(options: Partial<WorksheetState>) {
    setWorksheet((prev) => ({ ...prev, ...options }))
  }

  function handleCountRepetitionsChange(countRepetitions: number) {
    setWorksheet((prev) => ({ ...prev, countRepetitions }))
  }

  function handleLayoutChange(layout: ChoiceLayout) {
    setWorksheet((prev) => ({ ...prev, layout }))
  }

  function handleItemScaleChange(itemScale: number) {
    setWorksheet((prev) => ({ ...prev, itemScale: clamp(itemScale, ITEM_SCALE_MIN, ITEM_SCALE_MAX) }))
  }

  function handleUpdateItemScale(id: string, scale: number) {
    setWorksheet((prev) =>
      updateItemById(prev, id, (item) => ({ ...item, scale: clamp(scale, ITEM_SCALE_MIN, ITEM_SCALE_MAX) })),
    )
  }

  function handleResetItemScale(id: string) {
    setWorksheet((prev) =>
      updateItemById(prev, id, (item) => {
        const { scale, ...rest } = item
        void scale
        return rest
      }),
    )
  }

  function handleResetAllItemScales() {
    setWorksheet((prev) => {
      const stripScale = (item: WorksheetItem): WorksheetItem => {
        const { scale, ...rest } = item
        void scale
        return rest
      }
      return {
        ...prev,
        items: prev.items.map(stripScale),
        pairs: prev.pairs.map((pair) => ({
          ...pair,
          left: stripScale(pair.left),
          right: pair.right ? stripScale(pair.right) : null,
        })),
        sequenceItems: prev.sequenceItems.map(stripScale),
      }
    })
  }

  function handleOrientationChange(orientation: PageOrientation) {
    // Przeglądarka stosuje jedną regułę @page na jeden dialog drukowania.
    // Dlatego orientacja jest świadomie wspólna dla wszystkich stron projektu.
    setProject((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => ({ ...page, orientation })),
    }))
  }



  /** Przykład ustawia zadanie i nagłówek strony naraz - jeden krok cofania. */
  function handleApplyExample(example: WorksheetExample) {
    setProject((prev) => {
      const pages = [...prev.pages]
      const page = pages[prev.activePageIndex]
      if (!page) return prev
      const taskIndex = Math.min(prev.activeTaskIndex, page.tasks.length - 1)
      const tasks = [...page.tasks]
      tasks[taskIndex] = createWorksheet({
        orientation: page.orientation,
        instructionScale: tasks[taskIndex]?.instructionScale ?? 1,
        template: example.template,
        ...example.task,
      })
      pages[prev.activePageIndex] = { ...page, tasks, header: { ...page.header, ...example.header } }
      return { ...prev, pages }
    })
  }

  function handleHeaderChange(header: Partial<WorksheetHeader>) {
    setProject((prev) => {
      const pages = [...prev.pages]
      const page = pages[prev.activePageIndex]
      if (!page) return prev
      pages[prev.activePageIndex] = { ...page, header: { ...page.header, ...header } }
      return { ...prev, pages }
    })
  }

  function handleCutCardsShowBorderChange(cutCardsShowBorder: boolean) {
    setWorksheet((prev) => ({ ...prev, cutCardsShowBorder }))
  }

  function handleSequenceRepetitionsChange(sequenceRepetitions: number) {
    setWorksheet((prev) => ({ ...prev, sequenceRepetitions }))
  }

  function handleSequenceBlanksChange(sequenceBlanks: number) {
    setWorksheet((prev) => ({ ...prev, sequenceBlanks }))
  }

  function handleCategoriesChange(categories: string[]) {
    setWorksheet((prev) => ({ ...prev, categories }))
  }

  function handleVariantCountChange(variantCount: number) {
    setProject((prev) => {
      const pages = [...prev.pages]
      const page = pages[prev.activePageIndex]
      if (!page) return prev
      pages[prev.activePageIndex] = { ...page, variantCount }
      return { ...prev, pages }
    })
  }

  function handleAddItem(newItem: WorksheetItem) {
    setWorksheet((prev) => {
      if (prev.template === 'count' || prev.template === 'yesNo') {
        // Oba szablony pokazują dokładnie jeden element - nowy zastępuje poprzedni.
        return { ...prev, items: [newItem] }
      }

      if (prev.template === 'matchPairs') {
        const pairs = [...prev.pairs]
        const lastPair = pairs[pairs.length - 1]
        if (lastPair && !lastPair.right) {
          pairs[pairs.length - 1] = { ...lastPair, right: newItem }
        } else {
          pairs.push({ id: createId(), left: newItem, right: null })
        }
        return { ...prev, pairs }
      }

      if (prev.template === 'sequence') {
        // Wzór składa się z 2 do 4 elementów.
        if (prev.sequenceItems.length >= 4) {
          alert('Wzór może się składać maksymalnie z 4 elementów.')
          return prev
        }
        return { ...prev, sequenceItems: [...prev.sequenceItems, newItem] }
      }

      // Szablony "choice" - miękki limit elementów, żeby karta czytelnie się mieściła na A4.
      const maxItems = getMaxItems(prev.template)
      if (maxItems !== null && prev.items.length >= maxItems) {
        alert(`W tym szablonie można dodać maksymalnie ${maxItems} elementów.`)
        return prev
      }
      return { ...prev, items: [...prev.items, newItem] }
    })
  }

  function handleRemoveItem(id: string) {
    setWorksheet((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
      pairs: prev.pairs.filter((pair) => pair.id !== id),
      sequenceItems: prev.sequenceItems.filter((item) => item.id !== id),
    }))
  }

  function handleDuplicateItem(id: string) {
    setWorksheet((prev) => {
      if (prev.template === 'matchPairs') {
        const index = prev.pairs.findIndex((pair) => pair.id === id)
        if (index === -1) return prev
        const original = prev.pairs[index]
        const duplicate: MatchPair = {
          id: createId(),
          left: { ...original.left, id: createId() },
          right: original.right ? { ...original.right, id: createId() } : null,
        }
        const pairs = [...prev.pairs]
        pairs.splice(index + 1, 0, duplicate)
        return { ...prev, pairs }
      }

      if (prev.template === 'sequence') {
        const index = prev.sequenceItems.findIndex((item) => item.id === id)
        if (index === -1) return prev
        if (prev.sequenceItems.length >= 4) {
          alert('Wzór może się składać maksymalnie z 4 elementów.')
          return prev
        }
        const duplicate: WorksheetItem = { ...prev.sequenceItems[index], id: createId() }
        const sequenceItems = [...prev.sequenceItems]
        sequenceItems.splice(index + 1, 0, duplicate)
        return { ...prev, sequenceItems }
      }

      const index = prev.items.findIndex((item) => item.id === id)
      if (index === -1) return prev
      const maxItems = getMaxItems(prev.template)
      if (maxItems !== null && prev.items.length >= maxItems) {
        alert(`W tym szablonie można dodać maksymalnie ${maxItems} elementów.`)
        return prev
      }
      const duplicate: WorksheetItem = { ...prev.items[index], id: createId() }
      const items = [...prev.items]
      items.splice(index + 1, 0, duplicate)
      return { ...prev, items }
    })
  }

  function handleMoveItem(id: string, direction: 'up' | 'down') {
    setWorksheet((prev) => {
      if (prev.template === 'matchPairs') {
        return { ...prev, pairs: moveInArray(prev.pairs, id, direction) }
      }
      if (prev.template === 'sequence') {
        return { ...prev, sequenceItems: moveInArray(prev.sequenceItems, id, direction) }
      }
      return { ...prev, items: moveInArray(prev.items, id, direction) }
    })
  }

  function handleReorderItems(activeId: string, overId: string) {
    setWorksheet((prev) => {
      if (prev.template === 'matchPairs') {
        const oldIndex = prev.pairs.findIndex((p) => p.id === activeId)
        const newIndex = prev.pairs.findIndex((p) => p.id === overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newPairs = [...prev.pairs]
          const [moved] = newPairs.splice(oldIndex, 1)
          newPairs.splice(newIndex, 0, moved)
          return { ...prev, pairs: newPairs }
        }
      } else if (prev.template === 'sequence') {
        const oldIndex = prev.sequenceItems.findIndex((p) => p.id === activeId)
        const newIndex = prev.sequenceItems.findIndex((p) => p.id === overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newSequence = [...prev.sequenceItems]
          const [moved] = newSequence.splice(oldIndex, 1)
          newSequence.splice(newIndex, 0, moved)
          return { ...prev, sequenceItems: newSequence }
        }
      } else {
        const oldIndex = prev.items.findIndex((p) => p.id === activeId)
        const newIndex = prev.items.findIndex((p) => p.id === overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = [...prev.items]
          const [moved] = newItems.splice(oldIndex, 1)
          newItems.splice(newIndex, 0, moved)
          return { ...prev, items: newItems }
        }
      }
      return prev
    })
  }

  function handleUpdateCaption(id: string, caption: string) {
    setWorksheet((prev) => updateItemById(prev, id, (item) => ({ ...item, caption, showCaption: true })))
  }

  function handleToggleCaption(id: string) {
    setWorksheet((prev) =>
      updateItemById(prev, id, (item) => ({ ...item, showCaption: item.showCaption === false })),
    )
  }

  // Kliknięcie w zadanie na kartce: wybiera je i otwiera odpowiedni krok edytora.
  const handlePreviewTaskClick = useCallback((taskIndex: number) => {
    setActiveTask(taskIndex)
    const task = activePage.tasks[taskIndex]
    setStepRequest((prev) => ({ step: task?.template ? 'edit' : 'template', nonce: (prev?.nonce ?? 0) + 1 }))
  }, [setActiveTask, activePage.tasks])

  function handleShuffle() {
    setWorksheet((prev) => {
      if (prev.template === 'choice' || prev.template === 'categorize') {
        return { ...prev, items: shuffleArray(prev.items) }
      }
      if (prev.template === 'sameOrDifferent') {
        const [reference, ...answers] = prev.items
        if (!reference) return prev
        return { ...prev, items: [reference, ...shuffleArray(answers)] }
      }
      return prev
    })
    setShuffleSeed((seed) => seed + 1)
  }

  const showSupportThankYou = useCallback(() => {
    if (canShowSupportReminder()) setIsSupportThankYouOpen(true)
  }, [])

  const closeSupportThankYou = useCallback(() => {
    postponeSupportReminder()
    setIsSupportThankYouOpen(false)
  }, [])

  const disableSupportThankYou = useCallback(() => {
    disableSupportReminder()
    setIsSupportThankYouOpen(false)
  }, [])

  useEffect(() => () => finishPrintRef.current?.(), [])

  const handlePrint = useCallback(() => {
    if (finishPrintRef.current) return

    const finish = () => {
      if (!finishPrintRef.current) return
      window.removeEventListener('afterprint', finish)
      window.removeEventListener('focus', finishOnFocus)
      finishPrintRef.current = null
      setIsPrintingAllPages(false)
      window.setTimeout(showSupportThankYou, 0)
    }
    const finishOnFocus = () => window.setTimeout(finish, 0)

    finishPrintRef.current = finish
    window.addEventListener('afterprint', finish, { once: true })
    window.addEventListener('focus', finishOnFocus, { once: true })

    setIsPrintingAllPages(true)
    // Dwie klatki: pierwsza żeby React domontował ukryte strony, druga żeby przeglądarka
    // zdążyła je zmierzyć (ResizeObserver) zanim window.print() zrobi zrzut do PDF-a.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.print()
        } catch {
          finishPrintRef.current = null
          setIsPrintingAllPages(false)
          window.removeEventListener('afterprint', finish)
          window.removeEventListener('focus', finishOnFocus)
        }
      })
    })
  }, [showSupportThankYou])

  // Na telefonie najpierw krótka instrukcja, bo systemowe okno druku ukrywa „Zapisz jako PDF".
  const requestPrint = useCallback(() => {
    if (shouldShowMobilePrintHelp()) setIsPrintHelpOpen(true)
    else handlePrint()
  }, [handlePrint])

  const closePrintHelp = useCallback(() => setIsPrintHelpOpen(false), [])

  const printFromHelp = useCallback(() => {
    setIsPrintHelpOpen(false)
    handlePrint()
  }, [handlePrint])

  function handleExport() {
    downloadProjectJson(project, library.currentMeta.name)
  }

  // Plik otwiera się jako nowa karta - bieżąca zostaje na liście „Moje karty".
  function handleImport(text: string) {
    const imported = parseProjectJson(text)
    if (!imported) {
      alert('Nie udało się wczytać pliku - to nie jest poprawny projekt KartoLabu.')
      return
    }
    library.startProject(imported)
  }

  function handleNewProject() {
    library.startProject(createBlankProject())
    setIsProjectsOpen(false)
  }

  async function handleExportSaved(id: string) {
    const data = await library.exportData(id)
    if (data) downloadProjectJson(data.project, data.name)
  }

  function handleClear() {
    const task = createWorksheet({ template: worksheet.template, instructionScale: worksheet.instructionScale })
    const page = createPage(worksheet.orientation, task)
    page.header = { ...worksheet.header }
    resetProject({ pages: [page], activePageIndex: 0, activeTaskIndex: 0, showPageNumbers: false, showBranding: true })
  }

  // Dopasowanie podglądu: domyślnie chcemy widzieć CAŁĄ kartkę, więc skalujemy ją
  // do szerokości i wysokości wolnego miejsca. Ręcznie ustawiony zoom ma pierwszeństwo.
  const previewViewportRef = useRef<HTMLDivElement>(null)
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 })

  // Zależność od `isReady` jest konieczna: przed wczytaniem karty na ekranie stoi
  // „Wczytywanie...", panelu podglądu jeszcze nie ma i ref jest pusty.
  useLayoutEffect(() => {
    const element = previewViewportRef.current
    if (!element) return
    const measure = () => {
      const style = getComputedStyle(element)
      const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      setPanelSize({
        width: Math.max(0, element.clientWidth - horizontalPadding),
        height: Math.max(0, element.clientHeight - verticalPadding),
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [isReady])

  const fitZoom = useMemo(() => {
    const page = PAGE_SIZE_PX[activePage.orientation]
    if (panelSize.width === 0 || panelSize.height === 0) return 1
    const byWidth = panelSize.width / page.width
    const byHeight = panelSize.height / page.height
    return Math.min(1, Math.max(0.05, Math.min(byWidth, byHeight)))
  }, [panelSize, activePage.orientation])

  const effectiveZoom = previewZoom === null ? fitZoom : previewZoom / 100


  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">Wczytywanie...</div>
  }

  return (
    <div className="app-shell">
      <div className="app-layout">
        <div className="editor-panel print:hidden">
          <div className="editor-panel-content">
            <Editor
            worksheet={worksheet}
            tasks={activePage.tasks}
            activeTaskIndex={activeTaskIndex}
            onSelectTask={setActiveTask}
            onAddTask={addTask}
            onRemoveTask={removeTask}
            showAnswerKey={showAnswerKey}
            onToggleAnswerKey={() => setShowAnswerKey(!showAnswerKey)}
            showPageNumbers={project.showPageNumbers ?? false}
            onTogglePageNumbers={handleTogglePageNumbers}
            showBranding={project.showBranding ?? true}
            onToggleBranding={handleToggleBranding}
            onExport={handleExport}
            onImport={handleImport}
            onClear={handleClear}
            answerKeyPages={project.answerKeyPages ?? false}
            onToggleAnswerKeyPages={handleToggleAnswerKeyPages}
            projectName={library.currentMeta.name}
            onOpenProjects={openProjects}
            onNewProject={handleNewProject}
            onTemplateChange={handleTemplateChange}
            onHandwritingTextChange={handleHandwritingTextChange}
            onHandwritingModeChange={handleHandwritingModeChange}
            onHandwritingRepeatChange={handleHandwritingRepeatChange}
            onHandwritingFontChange={handleHandwritingFontChange}
            onWordSearchOptionsChange={handleWordSearchOptionsChange}
            onMazeLevelChange={handleMazeLevelChange}
            onMazeOptionsChange={handleMazeOptionsChange}
            onColoringOptionsChange={handleColoringOptionsChange}
            onMathOptionsChange={handleMathOptionsChange}
            onPatternOptionsChange={handlePatternOptionsChange}
            onHandwritingOptionsChange={handleHandwritingOptionsChange}
            onCrosswordOptionsChange={handleCrosswordOptionsChange}
            onDotOptionsChange={handleDotOptionsChange}
            onClockOptionsChange={handleClockOptionsChange}
            onInstructionChange={handleInstructionChange}
            onUpdateOptions={handleUpdateOptions}
            onCountRepetitionsChange={handleCountRepetitionsChange}
            onLayoutChange={handleLayoutChange}
            onItemScaleChange={handleItemScaleChange}
            onUpdateItemScale={handleUpdateItemScale}
            onResetItemScale={handleResetItemScale}
            onResetAllItemScales={handleResetAllItemScales}
            onOrientationChange={handleOrientationChange}
            onHeaderChange={handleHeaderChange}
            onCutCardsShowBorderChange={handleCutCardsShowBorderChange}
            onSequenceRepetitionsChange={handleSequenceRepetitionsChange}
            onSequenceBlanksChange={handleSequenceBlanksChange}
            onCategoriesChange={handleCategoriesChange}
            onVariantCountChange={handleVariantCountChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onDuplicateItem={handleDuplicateItem}
            onMoveItem={handleMoveItem}
            onUpdateCaption={handleUpdateCaption}
            onToggleCaption={handleToggleCaption}
            onReorderItems={handleReorderItems}
            onToggleCorrectAnswer={handleToggleCorrectAnswer}
            stepRequest={stepRequest}
            onShuffle={handleShuffle}
            onApplyExample={handleApplyExample}
            />
          </div>
        </div>
        <div className="preview-panel print:overflow-visible">
          <TopBar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onPrint={requestPrint}
            saveStatus={saveStatus}
            zoom={previewZoom}
            effectiveZoom={effectiveZoom}
            onZoomChange={setPreviewZoom}
          />
          <div className="page-manager-bar print:hidden w-full max-w-[21cm]">
            <PageManager
              project={project}
              onAdd={addPage}
              onRemove={removePage}
              onDuplicate={duplicatePage}
              onSelect={setActivePage}
              onReorder={reorderPages}
            />
          </div>
          <div className="preview-viewport" ref={previewViewportRef}>
            {/* `zoom` zamiast `transform: scale`, bo przelicza też wysokość - kartki nie zostawiają
              pustego pasa pod spodem ani nie wychodzą poza panel. Na wydruku wracamy do skali 1. */}
            <div
              className="flex flex-col items-center w-full gap-8 print:gap-0 preview-stack"
              style={{ zoom: effectiveZoom }}
            >
              {project.pages.map((page, idx) => (
                <div
                  key={page.id}
                  className={`w-full flex flex-col items-center gap-8 ${
                    idx === project.activePageIndex || isPrintingAllPages ? 'flex' : 'hidden print:flex'
                  }`}
                  style={{ pageBreakAfter: 'always' }}
                >
                  {Array.from({ length: page.variantCount }).map((_, variantIndex) => (
                    <WorksheetPreview
                      key={`${page.id}-${variantIndex}`}
                      page={page}
                      shuffleSeed={shuffleSeed}
                      variantIndex={variantIndex}
                      // Przy kluczu na osobnych stronach karty dla uczniów drukują się czyste.
                      showAnswerKey={showAnswerKey && !(project.answerKeyPages && isPrintingAllPages)}
                      showPageNumbers={project.showPageNumbers ?? false}
                      showBranding={project.showBranding ?? true}
                      pageIndex={idx}
                      totalPages={project.pages.length}
                      activeTaskIndex={idx === project.activePageIndex ? activeTaskIndex : undefined}
                      onTaskClick={idx === project.activePageIndex ? handlePreviewTaskClick : undefined}
                    />
                  ))}
                </div>
              ))}
              {/* Klucz dla nauczyciela na końcu wydruku - na ekranie ukryty, drukuje się także z Ctrl+P. */}
              {project.answerKeyPages &&
                project.pages.map((page, idx) =>
                  page.tasks.some((task) => task.template !== null && ANSWER_KEY_TEMPLATES.includes(task.template)) ? (
                    <div
                      key={`${page.id}-key`}
                      // Jak nieaktywne strony: ukryta strona nie ma wymiarów, więc szablony liczone
                      // z ResizeObserver (np. liczba zegarów) wyszłyby puste - pokazujemy ją na czas druku.
                      className={`${isPrintingAllPages ? 'flex' : 'hidden print:flex'} w-full flex-col items-center`}
                      style={{ pageBreakAfter: 'always' }}
                    >
                      {Array.from({ length: page.variantCount }).map((_, variantIndex) => (
                        <WorksheetPreview
                          key={`${page.id}-key-${variantIndex}`}
                          page={page}
                          shuffleSeed={shuffleSeed}
                          variantIndex={variantIndex}
                          showAnswerKey
                          isAnswerKeyPage
                          showPageNumbers={project.showPageNumbers ?? false}
                          showBranding={project.showBranding ?? true}
                          pageIndex={idx}
                          totalPages={project.pages.length}
                        />
                      ))}
                    </div>
                  ) : null,
                )}
            </div>
          </div>
        </div>
      </div>
      {applyUpdate && (
        <UpdateBanner
          // Najpierw zapis, żeby przeładowanie nie zgubiło ostatniej sekundy pracy.
          onReload={() => library.saveNow().finally(applyUpdate)}
          onDismiss={() => setApplyUpdate(null)}
        />
      )}
      <MyProjectsDialog
        isOpen={isProjectsOpen}
        projects={library.projects}
        currentId={library.currentMeta.id}
        isPersisted={library.isPersisted}
        onClose={() => setIsProjectsOpen(false)}
        onOpen={async (id) => {
          if (await library.openProject(id)) setIsProjectsOpen(false)
        }}
        onNew={handleNewProject}
        onRename={library.rename}
        onDuplicate={library.duplicate}
        onDelete={(id) => library.remove(id, createBlankProject)}
        onExport={handleExportSaved}
      />
      <MobilePrintHelp isOpen={isPrintHelpOpen} onPrint={printFromHelp} onClose={closePrintHelp} />
      <SupportThankYouModal
        isOpen={isSupportThankYouOpen}
        onPostpone={closeSupportThankYou}
        onDisable={disableSupportThankYou}
      />
    </div>
  )
}

/** Zamienia miejscami element o danym id z jego sąsiadem (góra/dół) w tablicy z polem `id`. */
function moveInArray<T extends { id: string }>(list: T[], id: string, direction: 'up' | 'down'): T[] {
  const index = list.findIndex((entry) => entry.id === id)
  if (index === -1) return list
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= list.length) return list

  const result = [...list]
  ;[result[index], result[targetIndex]] = [result[targetIndex], result[index]]
  return result
}

/**
 * Aktualizuje pojedynczy WorksheetItem po id, niezależnie od tego, czy siedzi
 * bezpośrednio w `items`, czy jest lewym/prawym elementem pary w `pairs`.
 */
function updateItemById(
  state: WorksheetState,
  id: string,
  updater: (item: WorksheetItem) => WorksheetItem,
): WorksheetState {
  const items = state.items.map((item) => (item.id === id ? updater(item) : item))
  const pairs = state.pairs.map((pair) => ({
    ...pair,
    left: pair.left.id === id ? updater(pair.left) : pair.left,
    right: pair.right && pair.right.id === id ? updater(pair.right) : pair.right,
  }))
  const sequenceItems = state.sequenceItems.map((item) => (item.id === id ? updater(item) : item))
  return { ...state, items, pairs, sequenceItems }
}

export default App
