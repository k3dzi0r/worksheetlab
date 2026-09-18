import { useMemo } from 'react'
import type { WorksheetState } from '../types/worksheet'
import type { MathTask } from '../mathTasks'
import { MATH_OPERATION_SIGNS, generateMathTasks } from '../mathTasks'
import { usePageSpace } from '../usePageSpace'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface MathTemplateProps {
  worksheet: WorksheetState
  seed: number
  showAnswerKey?: boolean
}

/** Wysokość wiersza działań przy itemScale = 1. */
const BASE_ROW_HEIGHT = 58
/** Bezpiecznik na wypadek, gdyby pomiar miejsca zawiódł. */
const MAX_TASKS = 150

export function MathTemplate({ worksheet, seed, showAnswerKey = false }: MathTemplateProps) {
  const {
    mathOperations = ['add'],
    mathMax = 20,
    mathCrossTen = true,
    mathMissing = 'result',
    instruction,
    itemScale = 1,
    simpleMode = false,
  } = worksheet

  const { containerRef, width, height } = usePageSpace([
    mathOperations,
    mathMax,
    mathCrossTen,
    mathMissing,
    itemScale,
    instruction,
    worksheet.header,
    worksheet.orientation,
    simpleMode,
  ])

  const rowHeight = BASE_ROW_HEIGHT * itemScale
  const fontSize = 22 * itemScale
  // Wszystkie liczby dostają tę samą szerokość, żeby znaki = stały w równej kolumnie.
  const digits = String(mathMax).length
  const slotWidth = fontSize * (0.62 * digits + 0.3)
  // Szerokość kolumny liczymy z tych samych wartości, z których składa się wiersz:
  // trzy pola na liczby plus znaki działania, znak równości, numer zadania i odstęp.
  const columnWidth = 3 * slotWidth + fontSize * 3.1

  // Zadania wypełniają kartkę: tyle kolumn i wierszy, ile realnie się mieści.
  const columns = width > 0 ? Math.max(1, Math.floor(width / columnWidth)) : 1
  // 2px zapasu, żeby zaokrąglenia przy drukowaniu nie zepchnęły ostatniego wiersza na kolejną stronę.
  const rows = height > 0 ? Math.max(1, Math.floor((height - 2) / rowHeight)) : 1
  const count = Math.min(MAX_TASKS, columns * rows)

  const tasks = useMemo(
    () =>
      generateMathTasks({
        operations: mathOperations,
        max: mathMax,
        crossTen: mathCrossTen,
        missing: mathMissing,
        count,
        seed,
      }),
    [mathOperations, mathMax, mathCrossTen, mathMissing, count, seed],
  )

  return (
    <div className="flex flex-col w-full">
      {instruction.trim() && (
        <div className="mb-4">
          <InstructionText instruction={instruction} simpleMode={simpleMode} />
        </div>
      )}

      <div ref={containerRef} className="w-full overflow-hidden">
        <div
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center text-gray-900"
              // Odstępy w jednostkach em, żeby szerokość kolumny liczona wyżej zgadzała się
              // z tym, co naprawdę renderuje przeglądarka, niezależnie od rozmiaru pisma.
              style={{ height: rowHeight, fontSize, gap: fontSize * 0.16 }}
            >
              <span className="text-gray-400 tabular-nums" style={{ fontSize: fontSize * 0.6 }}>
                {index + 1}.
              </span>
              <TaskLine task={task} fontSize={fontSize} slotWidth={slotWidth} showAnswerKey={showAnswerKey} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface TaskLineProps {
  task: MathTask
  fontSize: number
  /** Równa szerokość każdego pola na liczbę - dzięki niej znaki = stoją w jednej linii. */
  slotWidth: number
  showAnswerKey: boolean
}

/** Jedno działanie: trzy liczby, z których jedna jest miejscem na odpowiedź. */
function TaskLine({ task, fontSize, slotWidth, showAnswerKey }: TaskLineProps) {
  const values = [task.left, task.right, task.result]

  return (
    <span
      className="flex items-center tabular-nums whitespace-nowrap"
      style={{ gap: fontSize * 0.16 }}
    >
      {values.map((value, index) => (
        <span key={index} className="flex items-center" style={{ gap: fontSize * 0.16 }}>
          {index > 0 && <span>{index === 1 ? MATH_OPERATION_SIGNS[task.operation] : '='}</span>}
          <Slot
            value={value}
            isBlank={task.blank === index}
            width={slotWidth}
            height={fontSize * 1.5}
            showAnswerKey={showAnswerKey}
          />
        </span>
      ))}
    </span>
  )
}

function Slot({
  value,
  isBlank,
  width,
  height,
  showAnswerKey,
}: {
  value: number
  isBlank: boolean
  width: number
  height: number
  showAnswerKey: boolean
}) {
  if (!isBlank) {
    return (
      <span className="inline-flex items-center justify-center" style={{ width, height }}>
        {value}
      </span>
    )
  }

  // Puste miejsce to ramka na wpisanie liczby; w kluczu odpowiedzi pokazujemy w niej wynik.
  return (
    <span
      className={`inline-flex items-center justify-center border-2 rounded ${
        showAnswerKey ? 'border-gray-300 text-blue-600 font-semibold' : 'border-gray-400'
      }`}
      style={{ width, height }}
    >
      {showAnswerKey ? value : ''}
    </span>
  )
}
