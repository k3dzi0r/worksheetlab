import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface YesNoTemplateProps {
  instruction: string
  instructionScale?: number
  item: WorksheetItem | undefined
  itemScale: number
  useColors?: boolean
}

/** Szablon „Tak / Nie”: jeden element, pytanie nad nim i dwa duże pola odpowiedzi. */
export function YesNoTemplate({ instruction, instructionScale = 1, item, itemScale, useColors = false }: YesNoTemplateProps) {
  return (
    <div className="flex flex-col items-center gap-14 pt-10 h-full">
      <InstructionText instruction={instruction} instructionScale={instructionScale} />

      <div className="flex-1 flex items-center justify-center">
        {item ? (
          <WorksheetItemView item={item} baseScale={itemScale}  />
        ) : (
          <p className="text-gray-400">Wybierz element (obraz lub emoji).</p>
        )}
      </div>

      <div className="flex gap-10 w-full justify-center pb-10">
        <div
          className={`flex items-center justify-center border-4 ${useColors ? 'border-green-600 text-green-700 bg-green-50' : 'border-gray-800 text-gray-900'} rounded-2xl font-bold ${
            'w-44 h-24 text-3xl'
          }`}
        >
          TAK
        </div>
        <div
          className={`flex items-center justify-center border-4 ${useColors ? 'border-red-600 text-red-700 bg-red-50' : 'border-gray-800 text-gray-900'} rounded-2xl font-bold ${
            'w-44 h-24 text-3xl'
          }`}
        >
          NIE
        </div>
      </div>
    </div>
  )
}
