import type { WorksheetItem } from '../types/worksheet'
import { WorksheetItemView } from '../components/WorksheetPreview/WorksheetItemView'

interface ChoiceTemplateProps {
  instruction: string
  items: WorksheetItem[]
}

/** Szablon „Wybierz”: polecenie na górze, poniżej 2-6 elementów ułożonych równomiernie. */
export function ChoiceTemplate({ instruction, items }: ChoiceTemplateProps) {
  return (
    <div className="flex flex-col items-center gap-12 pt-8">
      <p className="text-xl font-semibold text-center">{instruction || 'Wpisz polecenie...'}</p>
      <div className="flex flex-wrap justify-center items-center gap-10">
        {items.map((item) => (
          <WorksheetItemView key={item.id} item={item} size="lg" />
        ))}
      </div>
    </div>
  )
}
