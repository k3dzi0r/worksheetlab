import { useState, useCallback } from 'react'
import type {
  WorksheetItem,
  WorksheetState,
  ProjectState,
  TemplateType,
  ChoiceLayout,
  PageOrientation,
  MatchPair,
} from './types/worksheet'
import { ITEM_SCALE_DEFAULT, ITEM_SCALE_MIN, ITEM_SCALE_MAX, DEFAULT_WORKSHEET_HEADER } from './types/worksheet'
import type { WorksheetHeader } from './types/worksheet'
import { createId, shuffleArray, clamp } from './utils'
import { downloadProjectJson, parseProjectJson } from './worksheetIO'
import { useUndoRedo } from './hooks/useUndoRedo'
import { useAutosave } from './hooks/useAutosave'
import { Editor } from './components/Editor/Editor'
import { WorksheetPreview } from './components/WorksheetPreview/WorksheetPreview'
import { PageManager } from './components/PageManager'

export const INITIAL_WORKSHEET: WorksheetState = {
  id: createId(),
  template: 'choice',
  instruction: '',
  items: [],
  pairs: [],
  countRepetitions: 5,
  layout: 'row',
  itemScale: ITEM_SCALE_DEFAULT,
  orientation: 'portrait',
  simpleMode: false,
  sequenceItems: [],
  sequenceRepetitions: 3,
  sequenceBlanks: 1,
  header: DEFAULT_WORKSHEET_HEADER,
  cutCardsShowBorder: true,
  categories: ['Kategoria 1', 'Kategoria 2'],
  variantCount: 1,
  correctAnswers: [],
}

export const INITIAL_PROJECT: ProjectState = {
  pages: [INITIAL_WORKSHEET],
  activePageIndex: 0,
}

/**
 * Miękki limit liczby elementów w niektórych szablonach, żeby karta czytelnie
 * mieściła się na A4. W trybie prostym limit jest niższy, bo elementy są większe.
 */
function getMaxItems(template: TemplateType, simpleMode: boolean): number | null {
  if (template === 'choice' || template === 'cutCards' || template === 'oddOneOut' || template === 'categorize') return simpleMode ? 6 : 12
  // "Taki sam / inny": 1 element wzorcowy + odpowiedzi, więc limit jest o 1 wyższy.
  if (template === 'sameOrDifferent') return simpleMode ? 7 : 13
  return null
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

  const { saveStatus, hasDraft, loadDraft, deleteDraft, isReady } = useAutosave(project, (state) => {
    resetProject(state)
  })




  
  const worksheet = project.pages[project.activePageIndex] || INITIAL_WORKSHEET

  const setWorksheet = useCallback((updater: (prev: WorksheetState) => WorksheetState) => {
    setProject((prevProj) => {
      const newPages = [...prevProj.pages]
      const activeIdx = prevProj.activePageIndex
      newPages[activeIdx] = updater(newPages[activeIdx] || INITIAL_WORKSHEET)
      return { ...prevProj, pages: newPages }
    })
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
      const newPage = { ...INITIAL_WORKSHEET, id: createId(), orientation: prev.pages[0]?.orientation || 'portrait' }
      return {
        ...prev,
        pages: [...prev.pages, newPage],
        activePageIndex: prev.pages.length,
      }
    })
  }, [setProject])

  const removePage = useCallback((index: number) => {
    setProject((prev) => {
      if (prev.pages.length <= 1) return prev
      const newPages = prev.pages.filter((_, i) => i !== index)
      const newActiveIndex = Math.min(prev.activePageIndex, newPages.length - 1)
      return { ...prev, pages: newPages, activePageIndex: newActiveIndex }
    })
  }, [setProject])

  const duplicatePage = useCallback((index: number) => {
    setProject((prev) => {
      const pageToCopy = prev.pages[index]
      if (!pageToCopy) return prev
      const newPage = { ...pageToCopy, id: createId() }
      const newPages = [...prev.pages]
      newPages.splice(index + 1, 0, newPage)
      return { ...prev, pages: newPages, activePageIndex: index + 1 }
    })
  }, [setProject])

  const setActivePage = useCallback((index: number) => {
    setProject((prev) => ({ ...prev, activePageIndex: index }))
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
    setWorksheet((prev) => ({ ...INITIAL_WORKSHEET, template, orientation: prev.orientation, simpleMode: prev.simpleMode }))
  }

  function handleHandwritingTextChange(text: string) {
    setWorksheet((prev) => ({ ...prev, handwritingText: text }))
  }

  function handleHandwritingRepeatChange(repeat: boolean) {
    setWorksheet((prev) => ({ ...prev, handwritingRepeat: repeat }))
  }

  function handleHandwritingModeChange(mode: 'solid' | 'tracing' | 'empty') {
    setWorksheet((prev) => ({ ...prev, handwritingMode: mode }))
  }

  function handleInstructionChange(instruction: string) {
    setWorksheet((prev) => ({ ...prev, instruction }))
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
    setWorksheet((prev) => ({ ...prev, orientation }))
  }

  function handleSimpleModeChange(simpleMode: boolean) {
    setWorksheet((prev) => ({ ...prev, simpleMode }))
  }

  function handleHeaderChange(header: Partial<WorksheetHeader>) {
    setWorksheet((prev) => ({ ...prev, header: { ...prev.header, ...header } }))
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
    setWorksheet((prev) => ({ ...prev, variantCount }))
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

      // Szablony "choice" i "oddOneOut" - miękki limit elementów, żeby karta czytelnie się mieściła na A4.
      const maxItems = getMaxItems(prev.template, prev.simpleMode)
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
      const maxItems = getMaxItems(prev.template, prev.simpleMode)
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

  function handleShuffle() {
    setWorksheet((prev) => {
      if (prev.template === 'choice' || prev.template === 'oddOneOut' || prev.template === 'categorize') {
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

  function handlePrint() {
    window.print()
  }

  function handleExport() {
    downloadProjectJson(project)
  }

  function handleImport(text: string) {
    const imported = parseProjectJson(text)
    if (!imported) {
      alert('Nie udało się wczytać pliku - to nie jest poprawny projekt WorksheetLab.')
      return
    }
    resetProject(imported)
  }

  function handleClear() {
    resetProject({
      ...INITIAL_PROJECT,
      pages: [
        {
          ...INITIAL_WORKSHEET,
          template: worksheet.template,
          orientation: worksheet.orientation,
          simpleMode: worksheet.simpleMode,
          header: worksheet.header,
        },
      ],
    })
  }

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">Wczytywanie...</div>
  }

  if (hasDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Wykryto zapis roboczy</h2>
          <p className="text-gray-600 mb-6">
            Znalazłem niezapisany projekt z poprzedniej sesji. Chcesz go przywrócić?
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={deleteDraft}
              className="px-6 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
            >
              Zacznij od nowa
            </button>
            <button
              onClick={loadDraft}
              className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              Przywróć projekt
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <div className="editor-panel">
        <Editor
          worksheet={worksheet}
          onTemplateChange={handleTemplateChange}
          onHandwritingTextChange={handleHandwritingTextChange}
          onHandwritingModeChange={handleHandwritingModeChange}
          onHandwritingRepeatChange={handleHandwritingRepeatChange}
          onInstructionChange={handleInstructionChange}
          onCountRepetitionsChange={handleCountRepetitionsChange}
          onLayoutChange={handleLayoutChange}
          onItemScaleChange={handleItemScaleChange}
          onUpdateItemScale={handleUpdateItemScale}
          onResetItemScale={handleResetItemScale}
          onResetAllItemScales={handleResetAllItemScales}
          onOrientationChange={handleOrientationChange}
          onSimpleModeChange={handleSimpleModeChange}
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
          onShuffle={handleShuffle}
          onPrint={handlePrint}
          onExport={handleExport}
          onImport={handleImport}
          onClear={handleClear}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          saveStatus={saveStatus}
          onReorderItems={handleReorderItems}
            onToggleCorrectAnswer={handleToggleCorrectAnswer}
            showAnswerKey={showAnswerKey}
            onToggleAnswerKey={() => setShowAnswerKey(!showAnswerKey)}
        />
      </div>
      <div className="preview-panel print:overflow-visible">
        <div className="print:hidden w-full max-w-[21cm] mb-4">
          <PageManager
            project={project}
            onAdd={addPage}
            onRemove={removePage}
            onDuplicate={duplicatePage}
            onSelect={setActivePage}
            onReorder={reorderPages}
          />
        </div>
        <div className="flex flex-col items-center w-full gap-8 print:gap-0">
          {project.pages.map((page, idx) => (
            <div
              key={page.id}
              className={`w-full flex flex-col items-center gap-8 ${idx === project.activePageIndex ? 'flex' : 'hidden print:flex'}`}
              style={{ pageBreakAfter: 'always' }}
            >
              {Array.from({ length: page.variantCount ?? 1 }).map((_, variantIndex) => (
                <WorksheetPreview
                  key={`${page.id}-${variantIndex}`}
                  worksheet={page}
                  shuffleSeed={shuffleSeed}
                  variantIndex={variantIndex}
                  showAnswerKey={showAnswerKey}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
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
