import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ITEM_SCALE_MAX, ITEM_SCALE_MIN, ITEM_SCALE_STEP } from '../../types/worksheet'
import type { WorksheetItem, WorksheetState } from '../../types/worksheet'

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
export function ElementsList({
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
