import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface CountTemplateProps {
  instruction: string
  item: WorksheetItem | undefined
  repetitions: number
  itemScale: number
  simpleMode?: boolean
}

/** Szablon „Policz”: jeden element powtórzony wiele razy + pole na odpowiedź. */
export function CountTemplate({ instruction, item, repetitions, itemScale, simpleMode = false }: CountTemplateProps) {
  return (
    <div className="flex flex-col gap-10 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />
      <div className={`flex flex-wrap justify-center items-center flex-1 ${simpleMode ? 'gap-9' : 'gap-6'}`}>
        {item &&
          Array.from({ length: repetitions }).map((_, index) => (
            <WorksheetItemView key={`${item.id}-${index}`} item={item} baseScale={itemScale} simpleMode={simpleMode} />
          ))}
        {!item && <p className="text-gray-400">Wybierz element do powielenia.</p>}
      </div>
      <p className={simpleMode ? 'text-2xl font-semibold' : 'text-lg font-medium'}>Odpowiedź: __________</p>
    </div>
  )
}
