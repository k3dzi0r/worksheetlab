import { TEMPLATE_OPTIONS } from '../../types/worksheet'
import type { WorksheetState } from '../../types/worksheet'

interface TaskStripProps {
  tasks: WorksheetState[]
  activeTaskIndex: number
  onSelectTask: (index: number) => void
  onAddTask: () => void
  onRemoveTask: (index: number) => void
}

/**
 * Zadania na bieżącej stronie A4. Przy jednym zadaniu to tylko dyskretny link „dodaj",
 * przy kilku - przełącznik, żeby było jasne, które zadanie się edytuje.
 */
export function TaskStrip({ tasks, activeTaskIndex, onSelectTask, onAddTask, onRemoveTask }: TaskStripProps) {
  const canAdd = tasks.length < 4
  if (tasks.length === 1) {
    return canAdd ? (
      <button type="button" onClick={onAddTask} className="self-start text-sm text-blue-600 hover:underline">
        + Dodaj drugie zadanie na tej stronie
      </button>
    ) : null
  }

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-2">
      <p className="px-1 pb-1.5 text-xs font-medium text-gray-600">
        Zadania na tej stronie - edytujesz <strong className="text-blue-800">zadanie {activeTaskIndex + 1}</strong>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tasks.map((task, index) => {
          const active = index === activeTaskIndex
          const label = TEMPLATE_OPTIONS.find((option) => option.value === task.template)?.label ?? 'puste'
          return (
            <span
              key={task.id ?? index}
              className={`inline-flex items-center rounded-lg border ${active ? 'border-blue-600 bg-white' : 'border-gray-200 bg-white/70'}`}
            >
              <button
                type="button"
                onClick={() => onSelectTask(index)}
                aria-pressed={active}
                className={`px-2.5 py-1.5 text-xs font-medium ${active ? 'text-blue-800' : 'text-gray-700'}`}
              >
                {index + 1}. {label}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Usunąć zadanie ${index + 1}?`)) onRemoveTask(index)
                }}
                aria-label={`Usuń zadanie ${index + 1}`}
                title="Usuń zadanie"
                className="pr-2 pl-0.5 py-1.5 text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            </span>
          )
        })}
        {canAdd && (
          <button
            type="button"
            onClick={onAddTask}
            className="px-2.5 py-1.5 rounded-lg border border-dashed border-blue-300 text-xs font-medium text-blue-700 hover:bg-white"
          >
            + Zadanie
          </button>
        )}
      </div>
    </section>
  )
}
