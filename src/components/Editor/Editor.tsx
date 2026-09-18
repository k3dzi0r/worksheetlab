import { useState } from 'react'
import type { WorksheetItem, WorksheetState, TemplateType } from '../../types/worksheet'
import { TEMPLATE_OPTIONS } from '../../types/worksheet'
import { ImageUploader } from '../ImageUploader/ImageUploader'
import { EmojiPicker } from '../EmojiPicker/EmojiPicker'
import type { EmojiEntry } from '../../data/emojis'
import { createId } from '../../utils'

interface EditorProps {
  worksheet: WorksheetState
  onTemplateChange: (template: TemplateType) => void
  onInstructionChange: (instruction: string) => void
  onCountRepetitionsChange: (count: number) => void
  onAddItem: (item: WorksheetItem) => void
  onRemoveItem: (id: string) => void
  onMoveItem: (id: string, direction: 'up' | 'down') => void
  onShuffle: () => void
  onPrint: () => void
  onClear: () => void
}

/** Lewy panel edycji: wybór szablonu, treść polecenia, dodawanie elementów, lista elementów. */
export function Editor({
  worksheet,
  onTemplateChange,
  onInstructionChange,
  onCountRepetitionsChange,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onShuffle,
  onPrint,
  onClear,
}: EditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  function handleImageSelected(dataUrl: string, fileName: string) {
    onAddItem({ id: createId(), source: 'image', imageDataUrl: dataUrl, label: fileName })
  }

  function handleEmojiSelected(entry: EmojiEntry) {
    onAddItem({ id: createId(), source: 'emoji', emoji: entry.emoji, label: entry.name })
  }

  const showShuffleButton = worksheet.template === 'choice' || worksheet.template === 'matchPairs'

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">WorksheetLab</h1>
        <p className="text-gray-500 text-sm">Kreator kart pracy A4</p>
      </header>

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

      {/* Dodawanie elementów */}
      <section>
        <h2 className="text-lg font-semibold mb-2">3. Dodaj elementy</h2>
        {worksheet.template === 'matchPairs' && (
          <p className="text-sm text-gray-500 mb-2">
            Elementy dodajesz na przemian: najpierw lewa kolumna pary, potem prawa.
          </p>
        )}
        {worksheet.template === 'count' && (
          <p className="text-sm text-gray-500 mb-2">Dodanie nowego elementu zastąpi poprzedni.</p>
        )}
        <div className="flex flex-col gap-3">
          <ImageUploader onImageSelected={handleImageSelected} />
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="w-full bg-gray-100 text-gray-900 font-medium py-3 rounded-lg text-base border border-gray-300 hover:bg-gray-200"
          >
            {showEmojiPicker ? 'Ukryj emoji' : 'Emoji'}
          </button>
          {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelected} />}
        </div>
      </section>

      {/* Lista elementów */}
      <section>
        <h2 className="text-lg font-semibold mb-2">4. Aktualne elementy</h2>
        <ElementsList worksheet={worksheet} onRemove={onRemoveItem} onMove={onMoveItem} />
      </section>

      {/* Akcje */}
      <section className="flex flex-col gap-3 pt-2 border-t border-gray-200">
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
        <button
          type="button"
          onClick={onClear}
          className="w-full bg-red-50 text-red-700 font-medium py-3 rounded-lg text-base border border-red-200 hover:bg-red-100"
        >
          Wyczyść kartę
        </button>
      </section>
    </div>
  )
}

interface ElementsListProps {
  worksheet: WorksheetState
  onRemove: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

/** Lista aktualnie użytych elementów – różny widok w zależności od szablonu. */
function ElementsList({ worksheet, onRemove, onMove }: ElementsListProps) {
  if (worksheet.template === 'matchPairs') {
    if (worksheet.pairs.length === 0) {
      return <p className="text-gray-400 text-sm">Brak dodanych par.</p>
    }
    return (
      <ul className="flex flex-col gap-2">
        {worksheet.pairs.map((pair, index) => (
          <li
            key={pair.id}
            className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
          >
            <span className="text-sm text-gray-700">
              {itemPreview(pair.left)} ↔ {pair.right ? itemPreview(pair.right) : '(czeka na parę)'}
            </span>
            <RowControls
              index={index}
              total={worksheet.pairs.length}
              id={pair.id}
              onRemove={onRemove}
              onMove={onMove}
            />
          </li>
        ))}
      </ul>
    )
  }

  if (worksheet.items.length === 0) {
    return <p className="text-gray-400 text-sm">Brak dodanych elementów.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {worksheet.items.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
        >
          <span className="text-sm text-gray-700">{itemPreview(item)}</span>
          <RowControls
            index={index}
            total={worksheet.items.length}
            id={item.id}
            onRemove={onRemove}
            onMove={onMove}
          />
        </li>
      ))}
    </ul>
  )
}

function itemPreview(item: WorksheetItem): string {
  return item.source === 'emoji' ? `${item.emoji} ${item.label}` : `🖼️ ${item.label}`
}

interface RowControlsProps {
  index: number
  total: number
  id: string
  onRemove: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

function RowControls({ index, total, id, onRemove, onMove }: RowControlsProps) {
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
        onClick={() => onRemove(id)}
        className="px-2 py-1 text-red-600"
        aria-label="Usuń"
      >
        ✕
      </button>
    </div>
  )
}
