import { useRef, useState } from 'react'
import type {
  WorksheetItem,
  WorksheetState,
  TemplateType,
  ChoiceLayout,
  PageOrientation,
  WorksheetHeader,
} from '../../types/worksheet'
import { TEMPLATE_OPTIONS, ITEM_SCALE_MIN, ITEM_SCALE_MAX, ITEM_SCALE_STEP } from '../../types/worksheet'
import { ImageUploader } from '../ImageUploader/ImageUploader'
import { EmojiPicker } from '../EmojiPicker/EmojiPicker'
import type { EmojiEntry } from '../../data/emojis'
import { createId } from '../../utils'

/** Usuwa rozszerzenie pliku (np. ".png"), żeby zaproponować czytelną nazwę jako podpis. */
function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, '')
}

interface EditorProps {
  worksheet: WorksheetState
  onTemplateChange: (template: TemplateType) => void
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
}

/** Lewy panel edycji: wybór szablonu, treść polecenia, dodawanie elementów, lista elementów. */
export function Editor({
  worksheet,
  onTemplateChange,
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
}: EditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

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

      {/* Dodawanie elementów */}
      <section>
        <h2 className="text-lg font-semibold mb-2">3. Dodaj elementy</h2>
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
        <ElementsList
          worksheet={worksheet}
          onRemove={onRemoveItem}
          onDuplicate={onDuplicateItem}
          onMove={onMoveItem}
          onUpdateCaption={onUpdateCaption}
          onToggleCaption={onToggleCaption}
          onUpdateItemScale={onUpdateItemScale}
          onResetItemScale={onResetItemScale}
        />
      </section>

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
            className="flex-1 bg-gray-100 text-gray-900 font-medium py-3 rounded-lg text-base border border-gray-300 hover:bg-gray-200"
          >
            Importuj projekt
          </button>
        </div>
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
  onDuplicate: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  onUpdateCaption: (id: string, caption: string) => void
  onToggleCaption: (id: string) => void
  onUpdateItemScale: (id: string, scale: number) => void
  onResetItemScale: (id: string) => void
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
}: ElementsListProps) {
  if (worksheet.template === 'matchPairs') {
    if (worksheet.pairs.length === 0) {
      return <p className="text-gray-400 text-sm">Brak dodanych par.</p>
    }
    return (
      <ul className="flex flex-col gap-3">
        {worksheet.pairs.map((pair, index) => (
          <li key={pair.id} className="border border-gray-200 rounded-lg px-3 py-2">
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
          </li>
        ))}
      </ul>
    )
  }

  const listItems = worksheet.template === 'sequence' ? worksheet.sequenceItems : worksheet.items

  if (listItems.length === 0) {
    return <p className="text-gray-400 text-sm">Brak dodanych elementów.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {listItems.map((item, index) => (
        <li key={item.id} className="border border-gray-200 rounded-lg px-3 py-2">
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
          </div>
        </li>
      ))}
    </ul>
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
