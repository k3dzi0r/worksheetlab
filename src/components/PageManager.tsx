import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DndContext, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ProjectState } from '../types/worksheet'

interface Props {
  project: ProjectState
  onAdd: () => void
  onRemove: (idx: number) => void
  onDuplicate: (idx: number) => void
  onSelect: (idx: number) => void
  onReorder: (oldIdx: number, newIdx: number) => void
}

function SortableTab({ id, index, isActive, onSelect, onRemove, onDuplicate, totalPages }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border-t border-l border-r cursor-pointer whitespace-nowrap transition-colors select-none ${
        isActive ? 'bg-white border-gray-300 text-blue-600 font-bold' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
      }`}
    >
      <div {...attributes} {...listeners} className="flex items-center text-gray-400 hover:text-gray-600 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
      </div>
      
      <span onClick={() => onSelect(index)}>Strona {index + 1}</span>
      
      <div className="flex gap-1 ml-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(index) }}
          className="text-gray-400 hover:text-blue-500"
          title="Duplikuj"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        {totalPages > 1 && (
          <button
            type="button"
            onClick={(e) => { 
              e.stopPropagation()
              if (window.confirm('Czy na pewno chcesz usunąć tę stronę?')) onRemove(index)
            }}
            className="text-gray-400 hover:text-red-500"
            title="Usuń"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        )}
      </div>
    </div>
  )
}

export function PageManager({ project, onAdd, onRemove, onDuplicate, onSelect, onReorder }: Props) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = project.pages.findIndex(p => p.id === active.id)
      const newIndex = project.pages.findIndex(p => p.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex)
      }
    }
  }

  return (
    <div className="flex items-end w-full overflow-x-auto border-b border-gray-300 mb-4 bg-gray-50/50 print:hidden pt-2 px-2">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={project.pages.map(p => p.id!)} strategy={horizontalListSortingStrategy}>
          <div className="flex items-end gap-1 flex-1 min-w-max">
            {project.pages.map((page, idx) => (
              <SortableTab
                key={page.id}
                id={page.id!}
                index={idx}
                isActive={idx === project.activePageIndex}
                onSelect={onSelect}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                totalPages={project.pages.length}
              />
            ))}
            
            <button
              onClick={onAdd}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white border border-gray-300 border-b-transparent rounded-t-lg ml-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Nowa strona
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
