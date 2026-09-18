import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'

interface CountTemplateProps {
  instruction: string
  item: WorksheetItem | undefined
  repetitions: number
}

/** Szablon „Policz”: jeden element powtórzony wiele razy + pole na odpowiedź. */
export function CountTemplate({ instruction, item, repetitions }: CountTemplateProps) {
  return (
    <div className="flex flex-col gap-10 pt-8 h-full">
      <p className="text-xl font-semibold text-center">{instruction || 'Wpisz polecenie...'}</p>
      <div className="flex flex-wrap justify-center items-center gap-6 flex-1">
        {item &&
          Array.from({ length: repetitions }).map((_, index) => (
            <WorksheetItemView key={`${item.id}-${index}`} item={item} size="md" />
          ))}
        {!item && <p className="text-gray-400">Wybierz element do powielenia.</p>}
      </div>
      <p className="text-lg font-medium">Odpowiedź: __________</p>
    </div>
  )
}
