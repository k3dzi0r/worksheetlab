import { useState } from 'react'
import type {
  WorksheetItem,
  WorksheetState,
  TemplateType,
  ChoiceLayout,
  ItemSize,
  MatchPair,
} from './types/worksheet'
import { createId, shuffleArray } from './utils'
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
}

function App() {
  const [worksheet, setWorksheet] = useState<WorksheetState>(INITIAL_WORKSHEET)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  function handleTemplateChange(template: TemplateType) {
    // Każdy szablon ma inny kształt danych, więc przy zmianie czyścimy zawartość,
    // żeby uniknąć niespójnych stanów (np. par bez odpowiednika w innym szablonie).
    setWorksheet({ ...INITIAL_WORKSHEET, template })
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

  function handleAddItem(newItem: WorksheetItem) {
    setWorksheet((prev) => {
      if (prev.template === 'count') {
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

      // Szablon "choice" - miękki limit 6 elementów, żeby karta czytelnie się mieściła na A4.
      if (prev.items.length >= 6) {
        alert('W tym szablonie można dodać maksymalnie 6 elementów.')
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

      const index = prev.items.findIndex((item) => item.id === id)
      if (index === -1) return prev
      if (prev.template === 'choice' && prev.items.length >= 6) {
        alert('W tym szablonie można dodać maksymalnie 6 elementów.')
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
      return { ...prev, items: moveInArray(prev.items, id, direction) }
    })
  }

  function handleShuffle() {
    setWorksheet((prev) => {
      if (prev.template === 'choice') {
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

  function handleClear() {
    setWorksheet((prev) => ({ ...INITIAL_WORKSHEET, template: prev.template }))
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
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onDuplicateItem={handleDuplicateItem}
          onMoveItem={handleMoveItem}
          onShuffle={handleShuffle}
          onPrint={handlePrint}
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

export default App
