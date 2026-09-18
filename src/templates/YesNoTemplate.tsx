import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface YesNoTemplateProps {
  instruction: string
  item: WorksheetItem | undefined
  itemScale: number
  simpleMode?: boolean
}

/** Szablon „Tak / Nie”: jeden element, pytanie nad nim i dwa duże pola odpowiedzi. */
export function YesNoTemplate({ instruction, item, itemScale, simpleMode = false }: YesNoTemplateProps) {
  return (
    <div className="flex flex-col items-center gap-14 pt-10 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />

      <div className="flex-1 flex items-center justify-center">
        {item ? (
          <WorksheetItemView item={item} baseScale={itemScale} simpleMode={simpleMode} />
        ) : (
          <p className="text-gray-400">Wybierz element (obraz lub emoji).</p>
        )}
      </div>

      <div className="flex gap-10 w-full justify-center pb-10">
        <div
          className={`flex items-center justify-center border-4 border-gray-800 rounded-2xl font-bold text-gray-900 ${
            simpleMode ? 'w-56 h-28 text-4xl' : 'w-44 h-24 text-3xl'
          }`}
        >
          TAK
        </div>
        <div
          className={`flex items-center justify-center border-4 border-gray-800 rounded-2xl font-bold text-gray-900 ${
            simpleMode ? 'w-56 h-28 text-4xl' : 'w-44 h-24 text-3xl'
          }`}
        >
          NIE
        </div>
      </div>
    </div>
  )
}
