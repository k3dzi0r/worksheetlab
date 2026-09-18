import type { ChoiceLayout, ItemSize, WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'
import { clamp, hashToUnit } from '../utils'

interface ChoiceTemplateProps {
  instruction: string
  items: WorksheetItem[]
  layout: ChoiceLayout
  itemSize: ItemSize
  /** Zmienia się przy „Losuj kolejność” - dla układu rozrzuconego wylicza nowe pozycje. */
  seed: number
  simpleMode?: boolean
}

/**
 * Punkty startowe (procent szerokości/wysokości obszaru) dla każdej liczby elementów.
 * Do każdego punktu dodawany jest losowy, ale stabilny "jitter", żeby wyglądało naturalnie,
 * a nie jak sztywna siatka.
 */
const SCATTER_SLOTS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [
    [30, 45],
    [70, 55],
  ],
  3: [
    [25, 30],
    [75, 35],
    [50, 75],
  ],
  4: [
    [25, 25],
    [75, 30],
    [25, 75],
    [75, 70],
  ],
  5: [
    [20, 20],
    [80, 25],
    [50, 50],
    [22, 80],
    [78, 78],
  ],
  6: [
    [18, 22],
    [50, 15],
    [82, 22],
    [18, 78],
    [50, 88],
    [82, 78],
  ],
}

/** Szablon „Wybierz”: polecenie na górze, poniżej elementy w rzędzie albo rozrzucone po kartce. */
export function ChoiceTemplate({ instruction, items, layout, itemSize, seed, simpleMode = false }: ChoiceTemplateProps) {
  return (
    <div className="flex flex-col items-center gap-12 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />

      {layout === 'row' ? (
        <div className={`flex flex-wrap justify-center items-center ${simpleMode ? 'gap-16' : 'gap-10'}`}>
          {items.map((item) => (
            <WorksheetItemView key={item.id} item={item} size={itemSize} simpleMode={simpleMode} />
          ))}
        </div>
      ) : (
        <div className="relative flex-1 w-full">
          {items.map((item, index) => {
            const slots = SCATTER_SLOTS[items.length] ?? SCATTER_SLOTS[6]
            const [baseX, baseY] = slots[index] ?? [50, 50]
            const jitterX = (hashToUnit(`${item.id}-${seed}-x`) - 0.5) * 12
            const jitterY = (hashToUnit(`${item.id}-${seed}-y`) - 0.5) * 12
            const left = clamp(baseX + jitterX, 8, 92)
            const top = clamp(baseY + jitterY, 8, 92)
            return (
              <div
                key={item.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <WorksheetItemView item={item} size={itemSize} simpleMode={simpleMode} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
