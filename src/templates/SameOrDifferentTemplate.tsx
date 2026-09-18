import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface SameOrDifferentTemplateProps {
  instruction: string
  /** Pierwszy element to wzorzec, pozostałe to odpowiedzi do porównania. */
  items: WorksheetItem[]
  itemScale: number
  simpleMode?: boolean
}

/**
 * Szablon „Taki sam / inny”: jeden element wzorcowy wizualnie odseparowany ramką,
 * niżej odpowiedzi do porównania (np. „znajdź taki sam” albo „wskaż inny”).
 */
export function SameOrDifferentTemplate({ instruction, items, itemScale, simpleMode = false }: SameOrDifferentTemplateProps) {
  const [reference, ...answers] = items

  return (
    <div className="flex flex-col items-center gap-10 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wzorzec</span>
        <div className="border-2 border-gray-800 rounded-xl px-8 py-6 min-w-[6rem] min-h-[6rem] flex items-center justify-center">
          {reference ? (
            <WorksheetItemView item={reference} baseScale={itemScale} simpleMode={simpleMode} />
          ) : (
            <span className="text-gray-400 text-sm">Dodaj element wzorcowy</span>
          )}
        </div>
      </div>
      <div className={`flex flex-1 flex-wrap justify-center items-center ${simpleMode ? 'gap-16' : 'gap-10'}`}>
        {answers.map((item) => (
          <WorksheetItemView key={item.id} item={item} baseScale={itemScale} simpleMode={simpleMode} />
        ))}
      </div>
    </div>
  )
}
