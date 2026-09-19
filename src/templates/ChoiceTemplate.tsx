import type { ChoiceLayout, WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'
import { clamp, hashToUnit } from '../utils'

interface ChoiceTemplateProps {
  instruction: string
  instructionScale?: number
  items: WorksheetItem[]
  layout: ChoiceLayout
  itemScale: number
  /** Zmienia się przy „Losuj kolejność” - dla układu rozrzuconego wylicza nowe pozycje. */
  seed: number
  showCheckboxes?: boolean
}

/**
 * Wylicza przybliżoną pozycję siatki (procent szerokości/wysokości obszaru) dla elementu
 * o danym indeksie spośród `total`, żeby elementy rozkładały się równomiernie niezależnie
 * od tego, ile ich jest. Do wyniku dodawany jest losowy, ale stabilny "jitter" w ChoiceTemplate,
 * żeby wyglądało naturalnie, a nie jak sztywna siatka.
 */
function gridSlot(index: number, total: number): [number, number] {
  const cols = Math.ceil(Math.sqrt(total))
  const rows = Math.ceil(total / cols)
  const col = index % cols
  const row = Math.floor(index / cols)
  const x = cols === 1 ? 50 : 15 + (col / (cols - 1)) * 70
  const y = rows === 1 ? 50 : 15 + (row / (rows - 1)) * 70
  return [x, y]
}

/** Szablon „Wybierz”: polecenie na górze, poniżej elementy w rzędzie albo rozrzucone po kartce. */
export function ChoiceTemplate({ instruction, instructionScale = 1, items, layout, itemScale, seed, showCheckboxes = false }: ChoiceTemplateProps) {
  return (
    <div className="flex flex-col items-center gap-12 pt-8 h-full">
      <InstructionText instruction={instruction} instructionScale={instructionScale} />

      {layout === 'row' ? (
        <div className={`flex flex-wrap justify-center items-center gap-10`}>
          {items.map((item) => (
            <div key={item.id} className="flex flex-col items-center">
              <WorksheetItemView item={item} baseScale={itemScale}  />
              {showCheckboxes && <div className={`border-4 border-gray-400 rounded-lg w-8 h-8 mt-2`} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative flex-1 w-full">
          {items.map((item, index) => {
            const [baseX, baseY] = gridSlot(index, items.length)
            const jitterX = (hashToUnit(`${item.id}-${seed}-x`) - 0.5) * 12
            const jitterY = (hashToUnit(`${item.id}-${seed}-y`) - 0.5) * 12
            const left = clamp(baseX + jitterX, 8, 92)
            const top = clamp(baseY + jitterY, 8, 92)
            return (
              <div
                key={item.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <WorksheetItemView item={item} baseScale={itemScale}  />
                {showCheckboxes && <div className={`border-4 border-gray-400 rounded-lg w-8 h-8 mt-2`} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
