import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'
import { hashToUnit } from '../utils'
import { InstructionText } from '../components/WorksheetPreview/InstructionText'

interface CountTemplateProps {
  instruction: string
  item: WorksheetItem | undefined
  repetitions: number
  itemScale: number
  simpleMode?: boolean
  scattered?: boolean
}

/** Szablon „Policz”: jeden element powtórzony wiele razy + pole na odpowiedź. */
export function CountTemplate({ instruction, item, repetitions, itemScale, simpleMode = false, scattered = false }: CountTemplateProps) {
  return (
    <div className="flex flex-col gap-10 pt-8 h-full">
      <InstructionText instruction={instruction} simpleMode={simpleMode} />
      
        {item && scattered ? (
          <div className="relative w-full h-full flex-1">
            {Array.from({ length: repetitions }).map((_, index) => {
              const left = 10 + hashToUnit(`count-x-${index}`) * 80;
              const top = 10 + hashToUnit(`count-y-${index}`) * 80;
              return (
                <div key={`${item.id}-${index}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
                  <WorksheetItemView item={item} baseScale={itemScale} simpleMode={simpleMode} />
                </div>
              );
            })}
          </div>
        ) : item && !scattered ? (
          <div className={`flex flex-wrap justify-center items-center flex-1 ${simpleMode ? 'gap-9' : 'gap-6'}`}>
            {Array.from({ length: repetitions }).map((_, index) => (
              <WorksheetItemView key={`${item.id}-${index}`} item={item} baseScale={itemScale} simpleMode={simpleMode} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Wybierz element do powielenia.</p>
        )}
      <p className={simpleMode ? 'text-2xl font-semibold' : 'text-lg font-medium'}>Odpowiedź: __________</p>
    </div>
  )
}
