import { useState } from 'react'
import type { EmojiEntry } from '../../../data/emojis'
import type { WorksheetItem, WorksheetState } from '../../../types/worksheet'
import { createId } from '../../../utils'
import { EmojiPicker } from '../../EmojiPicker/EmojiPicker'
import { ImageUploader } from '../../ImageUploader/ImageUploader'
import { MyLibrary } from '../../MyLibrary/MyLibrary'
import { ElementsList } from '../ElementsList'

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, '')
}

/** Dodawanie obrazków i emoji oraz lista elementów karty (szablony obrazkowe). */
export function ItemsEditor({ worksheet, onAddItem, onRemoveItem, onDuplicateItem, onMoveItem, onUpdateCaption, onToggleCaption, onUpdateItemScale, onResetItemScale, onReorderItems, onToggleCorrectAnswer }: { worksheet: WorksheetState; onAddItem: (item: WorksheetItem) => void; onRemoveItem: (id: string) => void; onDuplicateItem: (id: string) => void; onMoveItem: (id: string, direction: 'up' | 'down') => void; onUpdateCaption: (id: string, caption: string) => void; onToggleCaption: (id: string) => void; onUpdateItemScale: (id: string, scale: number) => void; onResetItemScale: (id: string) => void; onReorderItems: (activeId: string, overId: string) => void; onToggleCorrectAnswer?: (answerId: string) => void }) {
  const [showLibrary, setShowLibrary] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  function handleImageSelected(dataUrl: string, fileName: string) {
    // Podpis jest od razu proponowany na podstawie nazwy pliku - użytkownik może go dowolnie zmienić.
    const caption = stripFileExtension(fileName)
    onAddItem({ id: createId(), source: 'image', imageDataUrl: dataUrl, label: fileName, caption, showCaption: false })
  }

  function handleEmojiSelected(entry: EmojiEntry) {
    // Podpis jest od razu proponowany na podstawie polskiej nazwy emoji - można go zmienić.
    onAddItem({ id: createId(), source: 'emoji', emoji: entry.emoji, label: entry.name, caption: entry.name, showCaption: false })
  }

  return (
    <>
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
    </>
  )
}
