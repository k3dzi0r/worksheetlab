import { useState } from 'react'
import type {
  WorksheetItem,
  WorksheetState,
  TemplateType,
  ChoiceLayout,
  ItemSize,
  PageOrientation,
  MatchPair,
} from './types/worksheet'
import { createId, shuffleArray } from './utils'
import { downloadWorksheetJson, parseWorksheetJson } from './worksheetIO'
import { Editor } from './components/Editor/Editor'
import { WorksheetPreview } from './components/WorksheetPreview/WorksheetPreview'

const INITIAL_WORKSHEET: WorksheetState = {
  template: 'choice',
  instruction: '',
  items: [],
  pairs: [],
  countRepetitions: 5,
  layout: 'row',
  itemSize: 'lg',
  orientation: 'portrait',
  simpleMode: false,
  sequenceItems: [],
  sequenceRepetitions: 3,
  sequenceBlanks: 1,
}

function App() {
  const [worksheet, setWorksheet] = useState<WorksheetState>(INITIAL_WORKSHEET)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  function handleTemplateChange(template: TemplateType) {
    // Każdy szablon ma inny kształt danych, więc przy zmianie czyścimy zawartość,
    // żeby uniknąć niespójnych stanów (np. par bez odpowiednika w innym szablonie).
    // Orientacja strony to ustawienie globalne, więc ją zachowujemy.
    setWorksheet((prev) => ({ ...INITIAL_WORKSHEET, template, orientation: prev.orientation, simpleMode: prev.simpleMode }))
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

  function handleItemSizeChange(itemSize: ItemSize) {
    setWorksheet((prev) => ({ ...prev, itemSize }))
  }

  function handleOrientationChange(orientation: PageOrientation) {
    setWorksheet((prev) => ({ ...prev, orientation }))
  }

  function handleSimpleModeChange(simpleMode: boolean) {
    setWorksheet((prev) => ({ ...prev, simpleMode }))
  }

  function handleSequenceRepetitionsChange(sequenceRepetitions: number) {
    setWorksheet((prev) => ({ ...prev, sequenceRepetitions }))
  }

  function handleSequenceBlanksChange(sequenceBlanks: number) {
    setWorksheet((prev) => ({ ...prev, sequenceBlanks }))
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
      // W trybie prostym elementy są większe, więc limit jest niższy.
      const maxItems = prev.simpleMode ? 4 : 6
      if (prev.items.length >= maxItems) {
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
      const maxItems = prev.simpleMode ? 4 : 6
      if ((prev.template === 'choice' || prev.template === 'oddOneOut') && prev.items.length >= maxItems) {
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
      if (prev.template === 'choice' || prev.template === 'oddOneOut') {
        return { ...prev, items: shuffleArray(prev.items) }
      }
      return prev
    })
    // Dla "Wybierz" (rozrzucone) i "Połącz w pary" seed wymusza nowe losowe pozycje
    // / nowe tasowanie prawej kolumny, bez zmiany faktycznej listy elementów/par.
    setShuffleSeed((seed) => seed + 1)
  }

  function handlePrint() {
    window.print()
  }

  function handleExport() {
    downloadWorksheetJson(worksheet)
  }

  function handleImport(text: string) {
    const imported = parseWorksheetJson(text)
    if (!imported) {
      alert('Nie udało się wczytać pliku - to nie jest poprawny projekt WorksheetLab.')
      return
    }
    setWorksheet(imported)
  }

  function handleClear() {
    setWorksheet((prev) => ({
      ...INITIAL_WORKSHEET,
      template: prev.template,
      orientation: prev.orientation,
      simpleMode: prev.simpleMode,
    }))
  }

  return (
    <div className="app-layout">
      <div className="editor-panel">
        <Editor
          worksheet={worksheet}
          onTemplateChange={handleTemplateChange}
          onInstructionChange={handleInstructionChange}
          onCountRepetitionsChange={handleCountRepetitionsChange}
          onLayoutChange={handleLayoutChange}
          onItemSizeChange={handleItemSizeChange}
          onOrientationChange={handleOrientationChange}
          onSimpleModeChange={handleSimpleModeChange}
          onSequenceRepetitionsChange={handleSequenceRepetitionsChange}
          onSequenceBlanksChange={handleSequenceBlanksChange}
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
        />
      </div>
      <div className="preview-panel">
        <WorksheetPreview worksheet={worksheet} shuffleSeed={shuffleSeed} />
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
